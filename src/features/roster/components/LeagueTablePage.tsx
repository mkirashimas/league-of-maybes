import { AddOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, Link as RouterLink, useNavigate } from 'react-router';
import { PATHS } from '../../../types';
import { useRosterGetPlayersQuery } from '../api';
import { useTraitDefinitions } from '../hooks/useTraitDefinitions';
import { useTraitLabels } from '../hooks/useTraitLabels';
import {
  computeOverall,
  PLAYER_STATUSES,
  ROSTER_NAMESPACE,
  type Player,
  type PlayerStatus,
} from '../types';
import { PlayerAvatar } from './PlayerAvatar';
import { StatusChip } from './StatusChip';

type Filter = 'current' | 'all' | PlayerStatus;
type SortKey = 'nickname' | 'status' | 'overall' | `trait:${string}`;
type Direction = 'asc' | 'desc';

interface Row {
  player: Player;
  overall: number | null;
}

const formatScore = (value: number | null | undefined) =>
  typeof value === 'number' ? value.toFixed(1) : '–';

/** Numbers sort with empty values last, whatever the direction. */
const compareNumbers = (a: number | null, b: number | null, direction: Direction) => {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return direction === 'asc' ? a - b : b - a;
};

export const LeagueTablePage = () => {
  const { t } = useTranslation([ROSTER_NAMESPACE, 'common']);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { data: players, isLoading, isError } = useRosterGetPlayersQuery();
  const traits = useTraitDefinitions();
  const { traitLabel } = useTraitLabels();
  const [filter, setFilter] = useState<Filter>('current');
  const [sortKey, setSortKey] = useState<SortKey>('overall');
  const [direction, setDirection] = useState<Direction>('desc');

  const scaleTraits = traits.activeDefinitions.filter((definition) => definition.kind === 'scale');

  const rows = useMemo<Row[]>(() => {
    const visible = (players ?? []).filter((player) =>
      filter === 'all'
        ? true
        : filter === 'current'
          ? player.status !== 'retired'
          : player.status === filter,
    );
    const withOverall = visible.map((player) => ({
      player,
      overall: computeOverall(player.traits, traits.definitions),
    }));
    return withOverall.sort((a, b) => {
      if (sortKey === 'nickname') {
        const order = a.player.nickname.localeCompare(b.player.nickname);
        return direction === 'asc' ? order : -order;
      }
      if (sortKey === 'status') {
        const order =
          PLAYER_STATUSES.indexOf(a.player.status) - PLAYER_STATUSES.indexOf(b.player.status);
        return direction === 'asc' ? order : -order;
      }
      if (sortKey === 'overall') {
        return compareNumbers(a.overall, b.overall, direction);
      }
      const key = sortKey.slice('trait:'.length);
      const valueOf = (row: Row) => {
        const value = row.player.traits[key];
        return typeof value === 'number' ? value : null;
      };
      return compareNumbers(valueOf(a), valueOf(b), direction);
    });
  }, [players, traits.definitions, filter, sortKey, direction]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setDirection(key === 'nickname' || key === 'status' ? 'asc' : 'desc');
    }
  };

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'overall', label: t('table.overall') },
    { key: 'nickname', label: t('table.nickname') },
    { key: 'status', label: t('table.status') },
    ...scaleTraits.map((definition) => ({
      key: `trait:${definition.key}` as SortKey,
      label: traitLabel(definition),
    })),
  ];

  const playerPath = (player: Player) => generatePath(PATHS.PLAYER, { playerId: player.id });

  const header = (
    <Stack
      direction="row"
      spacing={2}
      useFlexGap
      sx={(theme) => ({
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        [theme.breakpoints.down('sm')]: { alignItems: 'stretch', flexDirection: 'column' },
      })}
    >
      <Typography variant="h4" component="h1">
        {t('title')}
      </Typography>
      <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <TextField
          select
          size="small"
          label={t('filter.label')}
          value={filter}
          onChange={(event) => setFilter(event.target.value as Filter)}
          sx={(theme) => ({ minWidth: theme.spacing(20), flexGrow: 1 })}
        >
          <MenuItem value="current">{t('filter.current')}</MenuItem>
          <MenuItem value="all">{t('filter.all')}</MenuItem>
          {PLAYER_STATUSES.map((status) => (
            <MenuItem key={status} value={status}>
              {t(`status.${status}`)}
            </MenuItem>
          ))}
        </TextField>
        {isMobile && (
          <TextField
            select
            size="small"
            label={t('table.sortBy')}
            value={sortKey}
            onChange={(event) => handleSort(event.target.value as SortKey)}
            sx={(theme) => ({ minWidth: theme.spacing(20), flexGrow: 1 })}
          >
            {sortOptions.map((option) => (
              <MenuItem key={option.key} value={option.key}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        )}
        <Button
          variant="contained"
          startIcon={<AddOutlined />}
          component={RouterLink}
          to={PATHS.PLAYER_NEW}
          sx={{ flexGrow: 1 }}
        >
          {t('addPlayer')}
        </Button>
      </Stack>
    </Stack>
  );

  if (isLoading || traits.isLoading) {
    return (
      <Stack spacing={3}>
        {header}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Stack>
    );
  }

  if (isError || traits.isError) {
    return (
      <Stack spacing={3}>
        {header}
        <Alert severity="error">{t('common:loadError')}</Alert>
      </Stack>
    );
  }

  if (rows.length === 0) {
    return (
      <Stack spacing={3}>
        {header}
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" component="h2" gutterBottom>
            {players?.length ? t('empty.filteredTitle') : t('empty.title')}
          </Typography>
          <Typography color="text.secondary">
            {players?.length ? t('empty.filteredBody') : t('empty.body')}
          </Typography>
        </Paper>
      </Stack>
    );
  }

  if (isMobile) {
    return (
      <Stack spacing={3}>
        {header}
        <Stack spacing={1.5}>
          {rows.map(({ player, overall }) => (
            <Card key={player.id} variant="outlined">
              <CardActionArea component={RouterLink} to={playerPath(player)}>
                <CardContent>
                  <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                    <PlayerAvatar nickname={player.nickname} color={player.avatarColor} />
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" noWrap>
                        {player.nickname}
                      </Typography>
                      <StatusChip status={player.status} />
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" component="p">
                        {formatScore(overall)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('table.overall')}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      </Stack>
    );
  }

  const sortableHeader = (key: SortKey, label: string, numeric = false) => (
    <TableCell
      key={key}
      align={numeric ? 'right' : 'left'}
      sortDirection={sortKey === key ? direction : false}
    >
      <TableSortLabel
        active={sortKey === key}
        direction={sortKey === key ? direction : 'asc'}
        onClick={() => handleSort(key)}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );

  return (
    <Stack spacing={3}>
      {header}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              {sortableHeader('nickname', t('table.nickname'))}
              {sortableHeader('status', t('table.status'))}
              {sortableHeader('overall', t('table.overall'), true)}
              {scaleTraits.map((definition) =>
                sortableHeader(`trait:${definition.key}`, traitLabel(definition), true),
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(({ player, overall }) => (
              <TableRow
                key={player.id}
                hover
                onClick={() => void navigate(playerPath(player))}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <PlayerAvatar
                      nickname={player.nickname}
                      color={player.avatarColor}
                      size="small"
                    />
                    <Typography
                      component={RouterLink}
                      to={playerPath(player)}
                      onClick={(event) => event.stopPropagation()}
                      variant="body2"
                      sx={{
                        color: 'text.primary',
                        fontWeight: 'fontWeightMedium',
                        textDecoration: 'none',
                      }}
                    >
                      {player.nickname}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <StatusChip status={player.status} />
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'fontWeightBold' }}>
                  {formatScore(overall)}
                </TableCell>
                {scaleTraits.map((definition) => {
                  const value = player.traits[definition.key];
                  return (
                    <TableCell key={definition.key} align="right">
                      {typeof value === 'number' ? value : '–'}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
};
