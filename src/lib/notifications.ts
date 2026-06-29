import { supabase } from '@/integrations/supabase/client';

export type NotificationType = 
  | 'conversion_received'
  | 'payment_sent'
  | 'offer_approved'
  | 'offer_rejected'
  | 'withdrawal_approved'
  | 'withdrawal_rejected'
  | 'cap_warning'
  | 'fraud_alert'
  | 'welcome';

interface NotificationPayload {
  type: NotificationType;
  recipientUserId: string;
  recipientEmail?: string;
  data: Record<string, any>;
}

export async function sendNotification(payload: NotificationPayload) {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({
          type: payload.type,
          recipient_user_id: payload.recipientUserId,
          recipient_email: payload.recipientEmail,
          data: payload.data,
        }),
      }
    );

    if (!response.ok) {
      console.error('Notification failed:', await response.text());
      return false;
    }

    // Log notification
    await supabase.from('notification_logs').insert({
      user_id: payload.recipientUserId,
      type: payload.type,
      channel: 'email',
      status: 'sent',
      metadata: payload.data,
    });

    return true;
  } catch (error) {
    console.error('Notification error:', error);
    return false;
  }
}

// Pre-built notification senders for common events
export const notifications = {
  conversionReceived: (affiliateId: string, data: { offerId: string; payout: number; clickId: string }) =>
    sendNotification({
      type: 'conversion_received',
      recipientUserId: affiliateId,
      data: {
        subject: `💰 New Conversion — $${data.payout.toFixed(2)} earned!`,
        message: `You just earned $${data.payout.toFixed(2)} from a conversion. Click ID: ${data.clickId}`,
        ...data,
      },
    }),

  paymentSent: (affiliateId: string, data: { amount: number; method: string; txnId: string }) =>
    sendNotification({
      type: 'payment_sent',
      recipientUserId: affiliateId,
      data: {
        subject: `✅ Payment Sent — $${data.amount.toFixed(2)} via ${data.method}`,
        message: `Your withdrawal of $${data.amount.toFixed(2)} has been sent via ${data.method}. Transaction: ${data.txnId}`,
        ...data,
      },
    }),

  offerApproved: (affiliateId: string, data: { offerName: string; payout: number }) =>
    sendNotification({
      type: 'offer_approved',
      recipientUserId: affiliateId,
      data: {
        subject: `🎉 Offer Approved — ${data.offerName}`,
        message: `You've been approved for "${data.offerName}" at $${data.payout.toFixed(2)} per conversion. Start driving traffic!`,
        ...data,
      },
    }),

  withdrawalApproved: (affiliateId: string, data: { amount: number }) =>
    sendNotification({
      type: 'withdrawal_approved',
      recipientUserId: affiliateId,
      data: {
        subject: `💸 Withdrawal Approved — $${data.amount.toFixed(2)}`,
        message: `Your withdrawal request for $${data.amount.toFixed(2)} has been approved and will be processed shortly.`,
        ...data,
      },
    }),

  fraudAlert: (adminId: string, data: { type: string; details: string; clickId: string }) =>
    sendNotification({
      type: 'fraud_alert',
      recipientUserId: adminId,
      data: {
        subject: `🚨 Fraud Alert — ${data.type}`,
        message: `Suspicious activity detected: ${data.details}. Click ID: ${data.clickId}`,
        ...data,
      },
    }),

  capWarning: (advertiserId: string, data: { offerName: string; used: number; cap: number }) =>
    sendNotification({
      type: 'cap_warning',
      recipientUserId: advertiserId,
      data: {
        subject: `⚠️ Cap Warning — ${data.offerName} at ${Math.round((data.used / data.cap) * 100)}%`,
        message: `Offer "${data.offerName}" has used ${data.used} of ${data.cap} daily conversions.`,
        ...data,
      },
    }),
};
