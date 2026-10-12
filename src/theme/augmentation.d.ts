import '@mui/material/styles';

// TypeScript module augmentation for custom theme keys.
declare module '@mui/material/styles' {
  interface SurfacePalette {
    /** Background of the left navigation sidebar. */
    sidebar: string;
    /** Optional decorative stripe (a CSS gradient) under the top bar, e.g. the Pride rainbow. */
    stripe?: string;
  }

  interface Palette {
    surface: SurfacePalette;
  }

  interface PaletteOptions {
    surface?: Partial<SurfacePalette>;
  }
}
