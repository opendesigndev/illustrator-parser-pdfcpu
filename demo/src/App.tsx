// https://github.com/storeon/solidjs
import { StoreonProvider, } from '@storeon/solidjs'
import { store } from './store'

// https://hope-ui.com/docs/getting-started
import { HopeThemeConfig, HopeProvider } from "@hope-ui/solid"

const config: HopeThemeConfig = {
    initialColorMode: "system",
}

import Router from './Router'

export default () => (<HopeProvider config={config}>
    <StoreonProvider store={store}>
        <Router />
    </StoreonProvider>
</HopeProvider>
);
