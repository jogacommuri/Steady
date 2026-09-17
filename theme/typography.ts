import {
  useFonts,
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
  Archivo_800ExtraBold,
} from '@expo-google-fonts/archivo';

/** Archivo weight → font family, matching the Modernist system's one typeface. */
export const fonts = {
  regular: 'Archivo_400Regular',
  medium: 'Archivo_500Medium',
  semibold: 'Archivo_600SemiBold',
  bold: 'Archivo_700Bold',
  extrabold: 'Archivo_800ExtraBold',
} as const;

export type FontWeight = keyof typeof fonts;

/** `{ fontFamily }` for a given Archivo weight — spread into a text style. */
export function weight(w: FontWeight): { fontFamily: string } {
  return { fontFamily: fonts[w] };
}

/** Loads the Archivo weights the app uses. Gate rendering on this in the root layout. */
export function useAppFonts(): boolean {
  const [loaded] = useFonts({
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_600SemiBold,
    Archivo_700Bold,
    Archivo_800ExtraBold,
  });
  return loaded;
}
