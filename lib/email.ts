export async function sendPasswordResetLinkEmail(email: string, resetLink: string) {
  // This is a placeholder for a real email sending service (e.g., SendGrid, Mailgun).
  // In a real application, you would use an email library to send an HTML email.

  console.log('--- --- ---');
  console.log('--- --- ---');
  console.log('--- --- ---');
  console.log('SENDING EMAIL TO:', email);
  console.log('Subject: Reset your password');
  console.log('Body:');
  console.log('Click the link below to reset your password:');
  console.log(resetLink);
  console.log('This link will expire in 1 hour.');
  console.log('--- --- ---');
  console.log('--- --- ---');
  console.log('--- --- ---');

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  return { success: true };
}

export async function sendTemporaryPassword(toEmail: string, tempPassword: string, lang: 'pl' | 'en') {
  const templates = {
    pl: {
      subject: 'Twoje konto Ting Tong zostało utworzone – Zaloguj się natychmiast!',
      html: `
        Cześć!<br>
        Dziękujemy za wsparcie! Twoje konto zostało automatycznie utworzone, aby powiązać Twój napiwek z Twoim adresem e-mail.<br>
        Twoje dane do logowania:<br>
        Adres E-mail: ${toEmail}<br>
        Hasło Tymczasowe: ${tempPassword}<br>
        Możesz się teraz zalogować, używając tych danych. Kliknij poniżej:<br>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" style="display: inline-block; padding: 10px 20px; background-color: #ff0055; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 15px 0;">PRZEJDŹ DO LOGOWANIA</a><br>
        🚨 Ważna instrukcja bezpieczeństwa: Prosimy o natychmiastową zmianę tego hasła tymczasowego w Panelu Konta po pierwszym zalogowaniu, aby zapewnić bezpieczeństwo.<br>
        Pozdrawiamy,<br>
        Zespół Ting Tong
      `
    },
    en: {
      subject: 'Your Ting Tong account has been created – Log in immediately!',
      html: `
        Hello!<br>
        Thank you for your support! Your account has been automatically created to link your tip with your email address.<br>
        Your login details:<br>
        Email Address: ${toEmail}<br>
        Temporary Password: ${tempPassword}<br>
        You can now log in using these details. Click below:<br>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" style="display: inline-block; padding: 10px 20px; background-color: #ff0055; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 15px 0;">PROCEED TO LOGIN</a><br>
        🚨 Important security instruction: For security reasons, please immediately change this temporary password in the Account Panel after your first login to ensure security.<br>
        Regards,<br>
        Ting Tong Team
      `
    }
  };

  const { subject, html } = templates[lang] || templates['pl']; // Fallback to PL

  console.log('--- --- ---');
  console.log('--- --- ---');
  console.log('--- --- ---');
  console.log('SENDING EMAIL TO:', toEmail);
  console.log('Subject:', subject);
  console.log('Body:');
  console.log(html);
  console.log('--- --- ---');
  console.log('--- --- ---');
  console.log('--- --- ---');

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  return { success: true };
}
