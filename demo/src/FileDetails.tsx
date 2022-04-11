import { hope, Button, VStack } from '@hope-ui/solid'

import FileTextIcon from '../node_modules/feather-icons/dist/icons/file-text.svg'

import { useStoreon } from '@storeon/solidjs'

import { State, Events } from './store'
import { createSignal } from 'solid-js'

import { WASMContext } from '../../dist/wasm_context'

const FileDetails = ({ file }: { file: File }) => {
  const [loading, setLoading] = createSignal(false)
  const [state, dispatch] = useStoreon<State, Events>()
  const details = JSON.stringify({
    name: file.name,
    size: file.size,
    type: file.type,
  })

  async function onClick() {
    setLoading(true)
    const contents = new Uint8Array(await file.arrayBuffer())
    try {
      const ctx = await WASMContext(contents)
      dispatch('ctx', ctx)
    } catch (error) {
      dispatch('error', error)
    }
    setLoading(false)
  }

  return (
    <VStack>
      <hope.code>{details}</hope.code>
      <Button
        loading={loading()}
        disabled={!state.file}
        aria-label="Format"
        rightIcon={<FileTextIcon />}
        onClick={onClick}
      >
        Parse
      </Button>
    </VStack>
  )
}
export default FileDetails
