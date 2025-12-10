/**
 * Utilitaires Twilio pour WhatsApp
 */

// Fonction utilitaire pour envoyer un message via l'API Twilio REST
// (utilisée pour les messages asynchrones, pas les réponses immédiates)
export async function sendTwilioMessage(to: string, message: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
  
  if (!accountSid || !authToken || !fromNumber) {
    console.error('Twilio credentials manquants');
    return false;
  }

  try {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: `whatsapp:+${to}`,
          From: `whatsapp:${fromNumber}`,
          Body: message,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Erreur envoi Twilio:', error);
      return false;
    }

    console.log('✅ Message Twilio envoyé à', to);
    return true;
  } catch (error) {
    console.error('Erreur envoi Twilio:', error);
    return false;
  }
}




