/**
 * WhatsApp Notification Service
 * Handles sending / simulating WhatsApp message dispatch to parents and past students.
 */

const sendWhatsAppNotification = async (phoneNumber, title, message) => {
    if (!phoneNumber) {
        console.warn('⚠️ Cannot send WhatsApp notification: No phone/WhatsApp number provided.');
        return { success: false, error: 'No phone number provided' };
    }

    const cleanNumber = phoneNumber.trim();
    const formattedMessage = `*${title}*\n\n${message}\n\n_Bishop Martin High School Virtual Office_`;

    console.log(`\n📲 [WhatsApp Dispatch] ========================================`);
    console.log(`To: ${cleanNumber}`);
    console.log(`Message:\n${formattedMessage}`);
    console.log(`=================================================================\n`);

    return {
        success: true,
        channel: 'whatsapp',
        recipient: cleanNumber,
        sent_at: new Date().toISOString()
    };
};

module.exports = {
    sendWhatsAppNotification
};
