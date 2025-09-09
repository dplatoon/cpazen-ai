import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export function useProfileBootstrap() {
  const { user } = useAuth();

  useEffect(() => {
    const bootstrapProfile = async () => {
      if (!user) return;

      try {
        // Check if profile exists
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking profile:', error);
          return;
        }

        // If no profile exists, create one
        if (!profile) {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              user_id: user.id,
              email: user.email || '',
              role: 'affiliate'
            });

          if (insertError) {
            console.error('Error creating profile:', insertError);
          } else {
            console.log('Profile created for user:', user.id);
          }
        }
      } catch (error) {
        console.error('Error in profile bootstrap:', error);
      }
    };

    bootstrapProfile();
  }, [user]);
}