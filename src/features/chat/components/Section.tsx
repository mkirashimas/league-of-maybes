import { Paper, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface SectionProps {
  title: string;
  /** Shown on the right of the title (e.g. a completeness hint). */
  aside?: ReactNode;
  children: ReactNode;
}

/** A titled card used for each part of the Chat tab. */
export const Section = ({ title, aside, children }: SectionProps) => (
  <Paper variant="outlined" sx={(theme) => ({ p: 2.5, [theme.breakpoints.down('sm')]: { p: 2 } })}>
    <Stack spacing={2}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Typography variant="h6" component="h3">
          {title}
        </Typography>
        {aside}
      </Stack>
      {children}
    </Stack>
  </Paper>
);
