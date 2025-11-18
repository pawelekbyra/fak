import { render, screen } from '@testing-library/react';
import TopBar from '../TopBar';
import { UserProvider } from '@/context/UserContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { ToastProvider } from '@/context/ToastContext';

jest.mock('@/context/LanguageContext', () => ({
  ...jest.requireActual('@/context/LanguageContext'),
  useTranslation: () => ({
    t: (key) => {
      if (key === 'loggedOutText') return 'Please log in';
      return key;
    },
    language: 'en',
    setLanguage: jest.fn(),
  }),
}));

describe('TopBar', () => {
  it('renders login message when user is not logged in', () => {
    render(
      <ToastProvider>
        <LanguageProvider>
          <UserProvider>
            <TopBar />
          </UserProvider>
        </LanguageProvider>
      </ToastProvider>
    );

    const loginMessage = screen.getByText('Please log in');
    expect(loginMessage).toBeInTheDocument();
  });
});
