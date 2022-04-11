import {
  Button,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
  TabPanel,
} from '@hope-ui/solid'
import stringify from 'json-stable-stringify'
import { createResource, createSignal, ErrorBoundary, Show } from 'solid-js'
import { ArtBoard, ArtBoardRef } from '../../'
import ShuffleIcon from '../node_modules/feather-icons/dist/icons/shuffle.svg'
import { ErrorScreen } from './ErrorScreen'
import Monaco from './Monaco'

export const ArtBoardEditor = ({
  ctx,
  item,
}: {
  ctx: Context
  item: ArtBoardRef
}) => {
  const [val] = createResource(async () =>
    stringify(await ArtBoard(ctx, item), {
      space: '\t',
    })
  )
  const [showDiff, setShowDiff] = createSignal(false)
  const [diff, setDiff] = createSignal(undefined as string | undefined)
  const onInput = async (ev: { currentTarget: { files: any } }) =>
    setDiff(
      stringify(JSON.parse(await ev.currentTarget.files![0].text()), {
        space: '\t',
      })
    )

  return (
    <TabPanel height="100%" width="100%">
      <Show when={!val.loading} fallback={<Spinner />}>
        <ErrorBoundary
          fallback={(err) => (
            <ErrorScreen err={err} title="Parsing artboard failed" />
          )}
        >
          <Show when={showDiff()}>
            <Monaco disabled language="json" value={val} diff={diff} />
            <HStack spacing="$6" width="100%">
              <FormControl>
                <FormLabel for="file">Diff with...</FormLabel>
                <InputGroup id="file">
                  <InputLeftElement pointerEvents="none" color="$neutral8">
                    <Icon as={ShuffleIcon} />
                  </InputLeftElement>
                  <Input
                    type="file"
                    placeholder="Pick Illustrator file"
                    accept="application/json"
                    onInput={onInput}
                  />
                </InputGroup>
              </FormControl>
            </HStack>
          </Show>
          <Show when={!showDiff()}>
            <Monaco disabled language="json" value={val} />
            <Button
              style="margin-top: 1em;"
              aria-label="Format"
              rightIcon={<ShuffleIcon />}
              onClick={() => setShowDiff(true)}
            >
              Diff
            </Button>
          </Show>
        </ErrorBoundary>
      </Show>
    </TabPanel>
  )
}
