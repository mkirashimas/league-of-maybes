import { Box, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useState, type FormEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { GENDERS, MAX_HEALTH_NOTES_LENGTH, type Gender } from '../../cycle';
import {
  AVATAR_COLORS,
  PLAYER_STATUSES,
  ROSTER_NAMESPACE,
  type AvatarColor,
  type Player,
  type PlayerInput,
  type PlayerStatus,
} from '../types';
import { PlayerAvatar } from './PlayerAvatar';

export type PlayerDetails = Omit<PlayerInput, 'traits'>;

interface PlayerFormProps {
  /** Existing player when editing; empty form otherwise. */
  initial?: Player;
  /** Form id, so a submit button outside the form (e.g. in a dialog) can target it. */
  formId: string;
  onSubmit: (details: PlayerDetails) => void;
  /** Rendered after the fields (e.g. the page's buttons). */
  children?: ReactNode;
}

const MAX_AGE = 120;

export const PlayerForm = ({ initial, formId, onSubmit, children }: PlayerFormProps) => {
  const { t } = useTranslation([ROSTER_NAMESPACE, 'cycle']);
  const [nickname, setNickname] = useState(initial?.nickname ?? '');
  const [age, setAge] = useState(initial?.age != null ? String(initial.age) : '');
  const [occupation, setOccupation] = useState(initial?.occupation ?? '');
  const [city, setCity] = useState(initial?.city ?? '');
  const [metAt, setMetAt] = useState(initial?.metAt ?? '');
  const [metOn, setMetOn] = useState(initial?.metOn ?? '');
  const [status, setStatus] = useState<PlayerStatus>(initial?.status ?? 'prospect');
  const [gender, setGender] = useState<Gender>(initial?.gender ?? '');
  const [healthNotes, setHealthNotes] = useState(initial?.healthNotes ?? '');
  const [avatarColor, setAvatarColor] = useState<AvatarColor>(initial?.avatarColor ?? 'primary');
  const [touched, setTouched] = useState(false);

  const nicknameMissing = nickname.trim() === '';
  const parsedAge = age === '' ? null : Number(age);
  const ageInvalid =
    parsedAge !== null && (!Number.isInteger(parsedAge) || parsedAge < 18 || parsedAge > MAX_AGE);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (nicknameMissing || ageInvalid) {
      return;
    }
    onSubmit({
      nickname: nickname.trim(),
      age: parsedAge,
      occupation: occupation.trim(),
      city: city.trim(),
      metAt: metAt.trim(),
      metOn,
      status,
      gender,
      healthNotes: healthNotes.trim(),
      avatarColor,
    });
  };

  return (
    <Box component="form" id={formId} onSubmit={handleSubmit} noValidate>
      <Stack spacing={3}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <PlayerAvatar nickname={nickname} color={avatarColor} size="large" />
          <TextField
            label={t('form.nickname')}
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            required
            fullWidth
            autoFocus={!initial}
            error={touched && nicknameMissing}
            helperText={
              touched && nicknameMissing ? t('form.nicknameRequired') : t('form.nicknameHelper')
            }
            slotProps={{ htmlInput: { maxLength: 40 } }}
          />
        </Stack>

        <Box
          sx={(theme) => ({
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 2,
            [theme.breakpoints.down('sm')]: { gridTemplateColumns: '1fr' },
          })}
        >
          <TextField
            select
            label={t('form.status')}
            value={status}
            onChange={(event) => setStatus(event.target.value as PlayerStatus)}
          >
            {PLAYER_STATUSES.map((value) => (
              <MenuItem key={value} value={value}>
                {t(`status.${value}`)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label={t('form.gender')}
            value={gender}
            onChange={(event) => setGender(event.target.value as Gender)}
            helperText={t('form.genderHelper')}
          >
            <MenuItem value="">{t('cycle:gender.unset')}</MenuItem>
            {GENDERS.map((value) => (
              <MenuItem key={value} value={value}>
                {t(`cycle:gender.${value}`)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label={t('form.age')}
            type="number"
            value={age}
            onChange={(event) => setAge(event.target.value)}
            error={touched && ageInvalid}
            helperText={touched && ageInvalid ? t('form.ageInvalid') : undefined}
            slotProps={{ htmlInput: { min: 18, max: MAX_AGE } }}
          />
          <TextField
            label={t('form.occupation')}
            value={occupation}
            onChange={(event) => setOccupation(event.target.value)}
          />
          <TextField
            label={t('form.city')}
            value={city}
            onChange={(event) => setCity(event.target.value)}
          />
          <TextField
            label={t('form.metAt')}
            value={metAt}
            onChange={(event) => setMetAt(event.target.value)}
            helperText={t('form.metAtHelper')}
          />
          <TextField
            label={t('form.metOn')}
            type="date"
            value={metOn}
            onChange={(event) => setMetOn(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Box>

        <TextField
          label={t('cycle:health.label')}
          placeholder={t('cycle:health.placeholder')}
          helperText={t('cycle:health.helper')}
          value={healthNotes}
          onChange={(event) => setHealthNotes(event.target.value)}
          multiline
          minRows={2}
          slotProps={{ htmlInput: { maxLength: MAX_HEALTH_NOTES_LENGTH } }}
        />

        <Stack spacing={1}>
          <Box sx={{ typography: 'body2', color: 'text.secondary' }}>{t('form.color')}</Box>
          <ToggleButtonGroup
            value={avatarColor}
            exclusive
            onChange={(_event, value: AvatarColor | null) => value && setAvatarColor(value)}
            aria-label={t('form.color')}
            sx={{ flexWrap: 'wrap' }}
          >
            {AVATAR_COLORS.map((color) => (
              <ToggleButton key={color} value={color} aria-label={t(`color.${color}`)}>
                <Box
                  sx={(theme) => ({
                    width: theme.spacing(3),
                    height: theme.spacing(3),
                    borderRadius: '50%',
                    bgcolor: theme.palette[color].main,
                  })}
                />
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>

        {children}
      </Stack>
    </Box>
  );
};
