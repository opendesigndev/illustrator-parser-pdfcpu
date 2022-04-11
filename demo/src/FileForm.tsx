import { useStoreon } from '@storeon/solidjs'
import { State, Events } from './store'
import { Component } from 'solid-js'
import {
    Icon,
    Input,
    InputGroup,
    InputLeftElement,
    VStack,
    FormControl,
    FormLabel,
    FormHelperText,
} from "@hope-ui/solid"

import FilePlusIcon from "../node_modules/feather-icons/dist/icons/file-plus.svg"

const FileForm: Component = () => {
    const [_state, dispatch] = useStoreon<State, Events>()


    function handleInput(ev: Event) {
        console.assert(ev.target, "missing target on", ev)
        const input = ev.target as HTMLInputElement

        console.assert(input.files, "missing files on", input)
        const file = (input.files as FileList)[0] as File

        dispatch("processFile", file)
    }

    return (
        <VStack spacing="$6" width="100%">
            <FormControl>
                <FormLabel for="file">Illustrator file</FormLabel>
                <InputGroup id="file">
                    <InputLeftElement
                        pointerEvents="none"
                        color="$neutral8" >
                        <Icon as={FilePlusIcon} />
                    </InputLeftElement>
                    <Input
                        type="file"
                        placeholder="Pick Illustrator file"
                        accept="application/postscript"
                        onInput={handleInput} />
                </InputGroup>
                <FormHelperText>All processing happens in the browser. No Internet required</FormHelperText>
            </FormControl>
        </VStack>
    )
}
export default FileForm
