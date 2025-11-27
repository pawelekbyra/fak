import { Resend } from 'resend';

// Use a placeholder key if the environment variable is missing to prevent build failures.
// This is consistent with the project's handling of other secrets (e.g., Ably, Redis).
const resendApiKey = process.env.RESEND_API_KEY || 're_123456789';

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY is not set. Using dummy key for build/development.');
}

const resend = new Resend(resendApiKey);

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

export async function sendWelcomeEmail(email: string, tempPassword: string) {
  // If we are using the dummy key, don't attempt to send real emails (it will fail anyway).
  if (!process.env.RESEND_API_KEY) {
    console.warn('Skipping email send because RESEND_API_KEY is missing.');
    return { success: true, message: 'Email skipped (missing API key)' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Wsparcie <noreply@polutek.pl>',
      to: [email],
      subject: 'Witaj w Polutek!',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2>Witaj w Polutek!</h2>
          <p>Twoje konto zostało pomyślnie utworzone.</p>
          <p>Poniżej znajdują się Twoje dane logowania:</p>
          <div style="background: #f4f4f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>Hasło tymczasowe:</strong> ${tempPassword}</p>
          </div>
          <p>Zaloguj się i zmień hasło w ustawieniach profilu, aby zachować bezpieczeństwo konta.</p>
          <p>Pozdrawiamy,<br>Zespół Polutek</p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Exception sending welcome email:', error);
    return { success: false, error };
  }
}

export async function sendAccountDeletedEmail(email: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('Skipping email send because RESEND_API_KEY is missing.');
    return { success: true, message: 'Email skipped (missing API key)' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Wsparcie <noreply@polutek.pl>',
      to: [email],
      subject: 'Twoje konto Polutek zostało usunięte',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2>Konto usunięte</h2>
          <p>Twoje konto w serwisie Polutek zostało trwale usunięte zgodnie z Twoją dyspozycją.</p>
          <p>Wszystkie Twoje dane zostały skasowane.</p>
          <p>Jeśli to była pomyłka, niestety nie możemy przywrócić Twoich danych, ale zawsze możesz założyć nowe konto.</p>
          <p>Dziękujemy, że byłeś/aś z nami.</p>
          <p>Pozdrawiamy,<br>Zespół Polutek</p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending account deleted email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Exception sending account deleted email:', error);
    return { success: false, error };
  }
}
