import { Container } from '@mui/material';
import { LegalDocument } from './LegalDocument';

const LegalPage = ({ documentKey }: { documentKey: 'terms' | 'privacy' }) => (
  <Container
    maxWidth="md"
    sx={(theme) => ({
      py: 4,
      [theme.breakpoints.down('md')]: { py: 2, px: 2 },
    })}
  >
    <LegalDocument documentKey={documentKey} />
  </Container>
);

export const TermsPage = () => <LegalPage documentKey="terms" />;

export const PrivacyPage = () => <LegalPage documentKey="privacy" />;
