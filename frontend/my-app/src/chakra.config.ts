import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

export const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

const theme = extendTheme({ config });

export default theme;
