import {
  Heading,
  Image,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Text,
} from '@hope-ui/solid'
import { useStoreon } from '@storeon/solidjs'
import { createResource, For, Show, ErrorBoundary } from 'solid-js'
import { ArtBoardEditor } from './ArtBoardEditor'
import { ErrorScreen } from './ErrorScreen'
import Monaco from './Monaco'
import { Events, State } from './store'

import { ArtBoardRefs, PrivateData } from '../../dist/index'
import type { WasmContext, BitmapReader } from '../../dist/wasm_context'

const BitmapImage = ({ image }: { image: BitmapReader }) => {
  const [val] = createResource(image)

  return (
    <TabPanel height="100%">
      <Show when={!val.loading} fallback={<Spinner />}>
        <Heading>{val()!.name}</Heading>
        <Image
          src={URL.createObjectURL(
            new Blob([val()!.content], { type: val()!.mime })
          )}
          boxSize="$lg"
          objectFit="contain"
        />
      </Show>
    </TabPanel>
  )
}

const PrivateDataEditor = ({ ctx }: { ctx: WasmContext }) => {
  const [val] = createResource(async () =>
    JSON.stringify(await PrivateData(ctx), null, '\t')
  )

  return (
    <Show when={!val.loading} fallback={<Spinner />}>
      <ErrorBoundary
        fallback={(err) => (
          <ErrorScreen err={err} title="Parsing private data failed" />
        )}
      >
        <Monaco disabled language="json" value={val} />
      </ErrorBoundary>
    </Show>
  )
}

interface Props {
  ctx: WasmContext
}
const FileEditor = ({ ctx }: Props) => {
  const [_, dispatch] = useStoreon<State, Events>()
  const refs = ArtBoardRefs(ctx)
  const bitmapEntries = Object.entries(ctx.Bitmaps ?? {})
  return (
    <Tabs height="100%" width="100%" keepAlive>
      <TabList>
        <Tab>Version</Tab>
        <Tab>XRefTable</Tab>
        <Tab>Artboards</Tab>
        <Tab>PrivateData</Tab>
        <Show when={bitmapEntries.length > 0}>
          <Tab>Bitmaps</Tab>
        </Show>
      </TabList>
      <TabPanel>
        <Text as="kbd">{ctx.aiFile.Version}</Text>
      </TabPanel>
      <TabPanel height="100%">
        <Monaco
          disabled
          language="json"
          value={() => JSON.stringify(ctx.aiFile.XRefTable, null, '\t')}
        />
      </TabPanel>
      <TabPanel width="95%" height="100%">
        <Tabs colorScheme="accent" width="100%" height="100%" keepAlive>
          <TabList>
            <For each={refs} fallback={<Spinner />}>
              {(item) => <Tab>{item.idx + 1}</Tab>}
            </For>
          </TabList>
          <For each={refs} fallback={<Spinner />}>
            {(item) => <ArtBoardEditor ctx={ctx} item={item} />}
          </For>
        </Tabs>
      </TabPanel>
      <TabPanel height="100%">
        <PrivateDataEditor ctx={ctx} />
      </TabPanel>
      <Show when={bitmapEntries.length > 0}>
        <TabPanel>
          <Tabs orientation="vertical" colorScheme="accent" keepAlive>
            <TabList>
              <For each={bitmapEntries} fallback={<Spinner />}>
                {(_, idx) => <Tab>{idx}</Tab>}
              </For>
            </TabList>
            <For each={bitmapEntries} fallback={<Spinner />}>
              {([key, item]) => <BitmapImage image={item} />}
            </For>
          </Tabs>
        </TabPanel>
      </Show>
    </Tabs>
  )
}

export default FileEditor
