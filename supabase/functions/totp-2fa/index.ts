import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// TOTP implementation using Web Crypto API
async function generateTOTPSecret(): Promise<string> {
  const array = new Uint8Array(20);
  crypto.getRandomValues(array);
  return base32Encode(array);
}

function base32Encode(buffer: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  let bits = 0;
  let value = 0;
  
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      result += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  
  if (bits > 0) {
    result += alphabet[(value << (5 - bits)) & 31];
  }
  
  return result;
}

function base32Decode(encoded: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleanedInput = encoded.toUpperCase().replace(/=+$/, '');
  const result: number[] = [];
  let bits = 0;
  let value = 0;
  
  for (const char of cleanedInput) {
    const index = alphabet.indexOf(char);
    if (index === -1) continue;
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      result.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  
  return new Uint8Array(result);
}

async function generateTOTP(secret: string, timeStep: number = 30): Promise<string> {
  const key = base32Decode(secret);
  const time = Math.floor(Date.now() / 1000 / timeStep);
  const timeBuffer = new ArrayBuffer(8);
  const timeView = new DataView(timeBuffer);
  timeView.setBigUint64(0, BigInt(time));
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, timeBuffer);
  const signatureArray = new Uint8Array(signature);
  
  const offset = signatureArray[signatureArray.length - 1] & 0x0f;
  const code = (
    ((signatureArray[offset] & 0x7f) << 24) |
    ((signatureArray[offset + 1] & 0xff) << 16) |
    ((signatureArray[offset + 2] & 0xff) << 8) |
    (signatureArray[offset + 3] & 0xff)
  ) % 1000000;
  
  return code.toString().padStart(6, '0');
}

async function verifyTOTP(secret: string, code: string, window: number = 1): Promise<boolean> {
  for (let i = -window; i <= window; i++) {
    const timeStep = 30;
    const time = Math.floor(Date.now() / 1000 / timeStep) + i;
    
    const timeBuffer = new ArrayBuffer(8);
    const timeView = new DataView(timeBuffer);
    timeView.setBigUint64(0, BigInt(time));
    
    const key = base32Decode(secret);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, timeBuffer);
    const signatureArray = new Uint8Array(signature);
    
    const offset = signatureArray[signatureArray.length - 1] & 0x0f;
    const generatedCode = (
      ((signatureArray[offset] & 0x7f) << 24) |
      ((signatureArray[offset + 1] & 0xff) << 16) |
      ((signatureArray[offset + 2] & 0xff) << 8) |
      (signatureArray[offset + 3] & 0xff)
    ) % 1000000;
    
    if (generatedCode.toString().padStart(6, '0') === code) {
      return true;
    }
  }
  return false;
}

function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const array = new Uint8Array(4);
    crypto.getRandomValues(array);
    const code = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    codes.push(code.slice(0, 4) + '-' + code.slice(4, 8));
  }
  return codes;
}

async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, code, email } = await req.json();
    console.log(`2FA action: ${action} for user: ${user.email}`);

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    switch (action) {
      case 'setup': {
        // Generate new TOTP secret
        const secret = await generateTOTPSecret();
        const backupCodes = generateBackupCodes();
        const hashedCodes = await Promise.all(backupCodes.map(c => hashCode(c.replace('-', ''))));
        
        // Store in database (upsert)
        const { error: upsertError } = await serviceClient
          .from('user_2fa')
          .upsert({
            user_id: user.id,
            totp_secret: secret,
            is_enabled: false,
            backup_codes: hashedCodes,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });

        if (upsertError) {
          console.error('Error storing 2FA setup:', upsertError);
          throw new Error('Failed to initialize 2FA setup');
        }

        // Generate QR code URL
        const issuer = 'CPAzen';
        const otpauthUrl = `otpauth://totp/${issuer}:${encodeURIComponent(user.email!)}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;

        return new Response(
          JSON.stringify({ 
            secret, 
            otpauthUrl,
            backupCodes 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'verify-setup': {
        // Get stored secret
        const { data: twoFaData, error: fetchError } = await serviceClient
          .from('user_2fa')
          .select('totp_secret')
          .eq('user_id', user.id)
          .single();

        if (fetchError || !twoFaData?.totp_secret) {
          return new Response(
            JSON.stringify({ error: 'No 2FA setup found. Please start setup first.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Verify the code
        const isValid = await verifyTOTP(twoFaData.totp_secret, code);

        if (!isValid) {
          return new Response(
            JSON.stringify({ error: 'Invalid code. Please try again.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Enable 2FA
        const { error: enableError } = await serviceClient
          .from('user_2fa')
          .update({ is_enabled: true, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);

        if (enableError) {
          throw new Error('Failed to enable 2FA');
        }

        return new Response(
          JSON.stringify({ success: true, message: '2FA has been enabled successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'verify-login': {
        // This is called during login to verify the TOTP code
        // We need the email since user might not be fully authenticated yet
        if (!email) {
          return new Response(
            JSON.stringify({ error: 'Email is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get user by email
        const { data: userData, error: userError } = await serviceClient.auth.admin.listUsers();
        const targetUser = userData?.users?.find(u => u.email === email);

        if (!targetUser) {
          return new Response(
            JSON.stringify({ error: 'User not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get 2FA data
        const { data: twoFaData, error: fetchError } = await serviceClient
          .from('user_2fa')
          .select('totp_secret, backup_codes, is_enabled')
          .eq('user_id', targetUser.id)
          .single();

        if (fetchError || !twoFaData?.is_enabled) {
          return new Response(
            JSON.stringify({ error: '2FA is not enabled for this account' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // First try TOTP verification
        const isValidTOTP = await verifyTOTP(twoFaData.totp_secret, code);
        
        if (isValidTOTP) {
          return new Response(
            JSON.stringify({ success: true, method: 'totp' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Try backup code
        const cleanCode = code.replace('-', '').toUpperCase();
        const hashedInput = await hashCode(cleanCode);
        
        if (twoFaData.backup_codes?.includes(hashedInput)) {
          // Remove used backup code
          const newCodes = twoFaData.backup_codes.filter((c: string) => c !== hashedInput);
          await serviceClient
            .from('user_2fa')
            .update({ backup_codes: newCodes, updated_at: new Date().toISOString() })
            .eq('user_id', targetUser.id);

          return new Response(
            JSON.stringify({ success: true, method: 'backup', remainingCodes: newCodes.length }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ error: 'Invalid code' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'disable': {
        // Verify code before disabling
        const { data: twoFaData, error: fetchError } = await serviceClient
          .from('user_2fa')
          .select('totp_secret')
          .eq('user_id', user.id)
          .single();

        if (fetchError || !twoFaData?.totp_secret) {
          return new Response(
            JSON.stringify({ error: '2FA is not enabled' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const isValid = await verifyTOTP(twoFaData.totp_secret, code);

        if (!isValid) {
          return new Response(
            JSON.stringify({ error: 'Invalid code' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Delete 2FA record
        const { error: deleteError } = await serviceClient
          .from('user_2fa')
          .delete()
          .eq('user_id', user.id);

        if (deleteError) {
          throw new Error('Failed to disable 2FA');
        }

        return new Response(
          JSON.stringify({ success: true, message: '2FA has been disabled' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'regenerate-backup': {
        // Verify current code first
        const { data: twoFaData, error: fetchError } = await serviceClient
          .from('user_2fa')
          .select('totp_secret')
          .eq('user_id', user.id)
          .single();

        if (fetchError || !twoFaData?.totp_secret) {
          return new Response(
            JSON.stringify({ error: '2FA is not enabled' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const isValid = await verifyTOTP(twoFaData.totp_secret, code);

        if (!isValid) {
          return new Response(
            JSON.stringify({ error: 'Invalid code' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Generate new backup codes
        const newBackupCodes = generateBackupCodes();
        const hashedCodes = await Promise.all(newBackupCodes.map(c => hashCode(c.replace('-', ''))));

        const { error: updateError } = await serviceClient
          .from('user_2fa')
          .update({ backup_codes: hashedCodes, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);

        if (updateError) {
          throw new Error('Failed to regenerate backup codes');
        }

        return new Response(
          JSON.stringify({ success: true, backupCodes: newBackupCodes }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('2FA error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
