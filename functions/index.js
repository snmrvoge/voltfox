/**
 * VoltFox Cloud Functions
 * Secure backend API for sensitive operations like OpenAI calls
 */

const {onCall, HttpsError} = require('firebase-functions/v2/https');
const {onDocumentUpdated} = require('firebase-functions/v2/firestore');
const {defineSecret} = require('firebase-functions/params');
const OpenAI = require('openai');
const {Resend} = require('resend');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// Define secrets
const openaiApiKey = defineSecret('OPENAI_API_KEY');
const resendApiKey = defineSecret('RESEND_API_KEY');

/**
 * Analyzes device image using OpenAI GPT-4 Vision
 *
 * @param {Object} data - Request data containing base64Image
 * @param {Object} context - Auth context
 * @returns {Object} Device recognition result
 */
exports.analyzeDeviceImage = onCall(
  {secrets: [openaiApiKey]},
  async (request) => {
    // Check authentication
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'User must be authenticated to use AI analysis'
      );
    }

    const {base64Image, fileType} = request.data;

    if (!base64Image || !fileType) {
      throw new HttpsError(
        'invalid-argument',
        'Missing required parameters: base64Image and fileType'
      );
    }

    try {
      // Initialize OpenAI client with secret
      const openai = new OpenAI({
        apiKey: openaiApiKey.value(),
      });

      const prompt = `Analyze this device image and extract the following information in JSON format:

{
  "deviceType": "one of: drone, camera, laptop, phone, tablet, smartwatch, headphones, speaker, e-bike, other",
  "deviceName": "full product name if visible (e.g., 'DJI Mavic 3 Pro')",
  "brand": "brand name (e.g., 'DJI', 'Canon', 'Apple')",
  "model": "model number or name",
  "batteryType": "battery chemistry if visible or can be inferred: LiPo, Li-ion, NiMH, or Lead-Acid",
  "confidence": "confidence level from 0-100"
}

Important:
- Only return the JSON object, no additional text
- Use lowercase for deviceType
- If information is not visible or unclear, use null
- For batteryType, use your knowledge of common battery types for this device category
- Drones typically use LiPo batteries
- Phones/laptops typically use Li-ion batteries`;

      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: 'gpt-4o', // gpt-4o has vision capabilities
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${fileType};base64,${base64Image}`,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.2,
      });

      const content = response.choices?.[0]?.message?.content;

      if (!content) {
        throw new HttpsError('internal', 'No response from OpenAI API');
      }

      console.log('OpenAI Response:', content);

      // Parse JSON response
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : content;
        const parsed = JSON.parse(jsonString);

        return {
          deviceType: parsed.deviceType || null,
          deviceName: parsed.deviceName || null,
          brand: parsed.brand || null,
          model: parsed.model || null,
          batteryType: parsed.batteryType || null,
          confidence: parsed.confidence || 50,
          rawResponse: content,
        };
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        throw new HttpsError(
          'internal',
          'Could not parse AI response'
        );
      }
    } catch (error) {
      console.error('AI Analysis Error:', error);

      // Handle OpenAI API errors
      if (error.status === 429) {
        throw new HttpsError(
          'resource-exhausted',
          'OpenAI API quota exceeded. Please check your billing.'
        );
      }

      throw new HttpsError(
        'internal',
        `AI analysis failed: ${error.message}`
      );
    }
  }
);

/**
 * Send test notifications (email + push)
 * Callable function for testing notification system
 */
exports.sendTestNotifications = onCall(
  {secrets: [resendApiKey]},
  async (request) => {
    // Check authentication
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const userId = request.auth.uid;
    const {testType} = request.data; // 'push', 'email', or 'both'

    try {
      // Get user document
      const userDoc = await admin.firestore().collection('users').doc(userId).get();

      if (!userDoc.exists) {
        throw new HttpsError('not-found', 'User document not found');
      }

      const userData = userDoc.data();
      const results = {
        pushSent: false,
        emailSent: false,
      };

      // Send Push Notification
      if (testType === 'push' || testType === 'both') {
        const fcmTokens = userData.fcmTokens || [];

        if (fcmTokens.length > 0) {
          const message = {
            notification: {
              title: '🧪 VoltFox Test-Benachrichtigung',
              body: 'Push-Benachrichtigungen funktionieren perfekt! 🎉',
              icon: '/logo192.png',
            },
            data: {
              type: 'test',
              timestamp: new Date().toISOString(),
            },
            webpush: {
              notification: {
                icon: '/logo192.png',
                badge: '/logo192.png',
                vibrate: [200, 100, 200],
              },
              fcmOptions: {
                link: 'https://voltfox-b1cef.web.app/dashboard',
              },
            },
          };

          const pushResults = await Promise.allSettled(
            fcmTokens.map((token) =>
              admin.messaging().send({...message, token: token})
            )
          );

          const successCount = pushResults.filter(
            (r) => r.status === 'fulfilled'
          ).length;
          results.pushSent = successCount > 0;
          results.pushCount = successCount;
        }
      }

      // Send Email
      if (testType === 'email' || testType === 'both') {
        const preferences = userData.notificationPreferences || {};
        const userEmail = preferences.emailAddress || userData.email;

        if (userEmail) {
          const resend = new Resend(resendApiKey.value());

          const emailResult = await resend.emails.send({
            from: 'VoltFox <notifications@voltfox.app>',
            to: userEmail,
            subject: '🧪 VoltFox Test-E-Mail',
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: linear-gradient(135deg, #FF6B35 0%, #FFD23F 100%); padding: 30px; border-radius: 15px 15px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 32px;">🦊 VoltFox</h1>
                    <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Test-Benachrichtigung</p>
                  </div>

                  <div style="background: white; padding: 30px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 15px 15px;">
                    <h2 style="color: #10B981;">🧪 Test erfolgreich!</h2>
                    <p>Deine E-Mail-Benachrichtigungen funktionieren perfekt! 🎉</p>

                    <p>Du erhältst ab jetzt automatische Benachrichtigungen für:</p>
                    <ul>
                      <li>💀 Tote Akkus</li>
                      <li>🚨 Kritische Batteriezustände</li>
                      <li>⚠️ Niedrige Ladestände</li>
                      <li>💊 Niedrige Akku-Gesundheit</li>
                    </ul>

                    <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">

                    <a href="https://voltfox.app/dashboard"
                       style="display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #FFD23F 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin-top: 10px;">
                      Zum Dashboard →
                    </a>

                    <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">
                      Stay Foxy, Stay Charged! 🦊<br>
                      <a href="https://voltfox.app/notifications" style="color: #FF6B35; text-decoration: none;">Benachrichtigungseinstellungen verwalten</a>
                    </p>
                  </div>

                  <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
                    <p>Created by <a href="https://mr-vision.ch" style="color: #FF6B35; text-decoration: none;">Mr. Vision</a> ✨</p>
                  </div>
                </body>
              </html>
            `,
          });

          results.emailSent = !!emailResult.id;
        }
      }

      return results;
    } catch (error) {
      console.error('Error sending test notifications:', error);
      throw new HttpsError('internal', error.message);
    }
  }
);

/**
 * Send email AND push notifications when device status changes
 * Triggered on device document updates
 */
exports.onDeviceStatusChange = onDocumentUpdated(
  {
    document: 'users/{userId}/devices/{deviceId}',
    secrets: [resendApiKey],
  },
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();
    const userId = event.params.userId;
    const deviceId = event.params.deviceId;

    // Check if status changed or charge/health dropped significantly
    const statusChanged = before.status !== after.status;
    const chargeDropped = after.currentCharge < before.currentCharge &&
                         (after.currentCharge < 20 || Math.abs(after.currentCharge - before.currentCharge) > 15);
    const healthDropped = after.health < before.health &&
                         (after.health < 40 || Math.abs(after.health - before.health) > 10);

    if (!statusChanged && !chargeDropped && !healthDropped) {
      console.log('No significant change, no notification needed');
      return null;
    }

    console.log(`Device ${after.name} status changed: ${before.status} → ${after.status}`);

    try {
      // Get user document to check email preferences
      const userDoc = await admin.firestore().collection('users').doc(userId).get();

      if (!userDoc.exists) {
        console.log('User document not found');
        return null;
      }

      const userData = userDoc.data();
      const preferences = userData.notificationPreferences || {};

      // Check if user wants email notifications
      if (!preferences.emailNotifications) {
        console.log('User has email notifications disabled');
        return null;
      }

      // Check if user wants notifications for this type
      const shouldNotify =
        (after.status === 'dead') ||
        (after.status === 'critical' && preferences.notifyOnCritical) ||
        (after.status === 'warning' && preferences.notifyOnWarning) ||
        (after.currentCharge < 70 && after.health < 70 && preferences.notifyOnLowHealth);

      if (!shouldNotify) {
        console.log('Notification type disabled by user preferences');
        return null;
      }

      const userEmail = preferences.emailAddress || userData.email;

      if (!userEmail) {
        console.log('No email address found for user');
        return null;
      }

      // Initialize Resend client
      const resend = new Resend(resendApiKey.value());

      // Determine email content based on status
      let subject, message, emoji;

      if (after.status === 'dead') {
        emoji = '💀';
        subject = `VoltFox Alert: ${after.name} Battery Is Dead!`;
        message = `
          <h2 style="color: #DC2626;">${emoji} Critical Alert</h2>
          <p>Your device <strong>${after.name}</strong> has a dead battery!</p>
          <p><strong>Current Charge:</strong> ${after.currentCharge}%</p>
          <p><strong>Battery Health:</strong> ${after.health}%</p>
          <p style="margin-top: 20px;">⚡ Charge your device immediately to prevent damage.</p>
        `;
      } else if (after.status === 'critical') {
        emoji = '🚨';
        subject = `VoltFox Alert: ${after.name} Battery Is Critical!`;
        message = `
          <h2 style="color: #EF4444;">${emoji} Critical Battery Alert</h2>
          <p>Your device <strong>${after.name}</strong> needs immediate attention!</p>
          <p><strong>Current Charge:</strong> ${after.currentCharge}%</p>
          <p><strong>Battery Health:</strong> ${after.health}%</p>
          <p style="margin-top: 20px;">⚡ Charge your device soon to avoid damage.</p>
        `;
      } else if (after.status === 'warning') {
        emoji = '⚠️';
        subject = `VoltFox Warning: ${after.name} Battery Is Low`;
        message = `
          <h2 style="color: #F59E0B;">${emoji} Battery Warning</h2>
          <p>Your device <strong>${after.name}</strong> battery is getting low.</p>
          <p><strong>Current Charge:</strong> ${after.currentCharge}%</p>
          <p><strong>Battery Health:</strong> ${after.health}%</p>
          <p style="margin-top: 20px;">💡 Consider charging your device soon.</p>
        `;
      }

      // Send email using Resend
      const result = await resend.emails.send({
        from: 'VoltFox <notifications@voltfox.app>',
        to: userEmail,
        subject: subject,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #FF6B35 0%, #FFD23F 100%); padding: 30px; border-radius: 15px 15px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 32px;">🦊 VoltFox</h1>
                <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Battery Monitoring Alert</p>
              </div>

              <div style="background: white; padding: 30px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 15px 15px;">
                ${message}

                <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">

                <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
                  <strong>Last Charged:</strong> ${new Date(after.lastCharged).toLocaleDateString()}
                </p>

                <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
                  <strong>Device Type:</strong> ${after.type}
                </p>

                <a href="https://voltfox.app/dashboard"
                   style="display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #FFD23F 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin-top: 10px;">
                  View Device →
                </a>

                <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">
                  Stay Foxy, Stay Charged! 🦊<br>
                  <a href="https://voltfox.app/notifications" style="color: #FF6B35; text-decoration: none;">Manage notification settings</a>
                </p>
              </div>

              <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
                <p>Created by <a href="https://mr-vision.ch" style="color: #FF6B35; text-decoration: none;">Mr. Vision</a> ✨</p>
              </div>
            </body>
          </html>
        `,
      });

      console.log('Email sent successfully:', result);

      // SEND PUSH NOTIFICATION
      // Get user's FCM tokens
      const fcmTokens = userData.fcmTokens || [];

      if (fcmTokens.length > 0) {
        // Determine notification content
        let title, body, icon;

        if (after.status === 'dead') {
          title = '💀 VoltFox Critical Alert';
          body = `${after.name} battery is dead! Charge immediately.`;
          icon = '💀';
        } else if (after.status === 'critical') {
          title = '🚨 VoltFox Alert';
          body = `${after.name} battery is critical (${after.currentCharge}%)! Charge soon.`;
          icon = '🚨';
        } else if (after.status === 'warning') {
          title = '⚠️ VoltFox Warning';
          body = `${after.name} battery is low (${after.currentCharge}%). Consider charging.`;
          icon = '⚠️';
        }

        // Prepare push notification payload
        const message = {
          notification: {
            title: title,
            body: body,
            icon: '/logo192.png',
          },
          data: {
            deviceId: deviceId,
            deviceName: after.name,
            status: after.status,
            currentCharge: String(after.currentCharge),
            health: String(after.health),
            click_action: 'https://voltfox-b1cef.web.app/dashboard',
          },
          webpush: {
            notification: {
              icon: '/logo192.png',
              badge: '/logo192.png',
              vibrate: after.status === 'dead' ? [200, 100, 200, 100, 200] :
                       after.status === 'critical' ? [200, 100, 200] : [200],
              requireInteraction: after.status === 'dead' || after.status === 'critical',
            },
            fcmOptions: {
              link: 'https://voltfox-b1cef.web.app/dashboard',
            },
          },
        };

        // Send to all registered tokens
        const pushResults = await Promise.allSettled(
          fcmTokens.map((token) =>
            admin.messaging().send({
              ...message,
              token: token,
            })
          )
        );

        // Clean up invalid tokens
        const invalidTokens = [];
        pushResults.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`Failed to send to token ${index}:`, result.reason);
            if (result.reason.code === 'messaging/invalid-registration-token' ||
                result.reason.code === 'messaging/registration-token-not-registered') {
              invalidTokens.push(fcmTokens[index]);
            }
          } else {
            console.log(`Push notification sent successfully to token ${index}`);
          }
        });

        // Remove invalid tokens from user document
        if (invalidTokens.length > 0) {
          const validTokens = fcmTokens.filter((token) => !invalidTokens.includes(token));
          await admin.firestore().collection('users').doc(userId).update({
            fcmTokens: validTokens,
          });
          console.log(`Removed ${invalidTokens.length} invalid FCM tokens`);
        }

        console.log(`Push notifications sent to ${fcmTokens.length} devices`);
      } else {
        console.log('No FCM tokens found for user');
      }

      return result;
    } catch (error) {
      console.error('Error sending notification:', error);
      // Don't throw - we don't want to fail the device update if notification fails
      return null;
    }
  }
);
