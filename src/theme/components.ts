import type { Components, Theme } from '@mui/material/styles';

export const components: Components<Omit<Theme, 'components'>> = {
  MuiAppBar: {
    defaultProps: { elevation: 0, color: 'inherit', position: 'fixed' },
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }),
    },
  },
  MuiButton: {
    defaultProps: { disableElevation: true },
  },
  MuiCard: {
    styleOverrides: {
      // Clickable cards (a CardActionArea child) lift with a thicker shadow on hover.
      root: ({ theme }) => ({
        '&:has(> .MuiCardActionArea-root)': {
          boxShadow: theme.shadows[1],
          transition: theme.transitions.create('box-shadow'),
          '&:hover': { boxShadow: theme.shadows[8] },
        },
      }),
    },
  },
  MuiCardActionArea: {
    styleOverrides: {
      root: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'flex-start',
      },
    },
  },
  MuiPaper: {
    // No dark-mode elevation overlay: paper keeps the exact palette color.
    styleOverrides: { root: { backgroundImage: 'none' } },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: ({ theme }) => ({
        backgroundColor: theme.palette.surface.sidebar,
        borderRight: `1px solid ${theme.palette.divider}`,
      }),
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: theme.shape.borderRadius,
        '&.Mui-selected, &.Mui-selected:hover': {
          backgroundColor: theme.palette.action.selected,
        },
      }),
    },
  },
};
