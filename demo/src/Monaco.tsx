import { Component, onMount, onCleanup, createEffect } from 'solid-js';
import 'monaco-editor/esm/vs/editor/editor.all';
import 'monaco-editor/esm/vs/editor/standalone/common/themes';
import 'monaco-editor/esm/vs/language/json/monaco.contribution';
import { editor as mEditor } from 'monaco-editor/esm/vs/editor/editor.api';

import {
    hope, useColorModeValue
} from "@hope-ui/solid"

interface Props {
    disabled: boolean
    value: () => string | undefined
    diff?: (() => string | undefined)
    language?: string
}

const Monaco: Component<Props> = (props) => {
    const theme = useColorModeValue('' /* default is light */, 'vs-dark')
    let parent!: HTMLDivElement;
    let editor: mEditor.IStandaloneCodeEditor | mEditor.IStandaloneDiffEditor;

    const setupEditor = () => {
        const editorProps = {
            readOnly: props.disabled,
            language: props.language,
            theme: theme(),
            // WARNING: this is a hack to work around the fact that editor initially is hidden (via tabs)
            automaticLayout: true,
        }
        if (props.diff) {
            editor = mEditor.createDiffEditor(parent, editorProps);
        } else {
            editor = mEditor.create(parent, editorProps);
        }
    };

    // Initialize Monaco
    onMount(() => setupEditor());
    onCleanup(() => editor?.dispose());
    createEffect(() => {
        const value = props.value()
        if (props.diff) {
            const diff = props.diff() as string
            (editor as mEditor.IStandaloneDiffEditor).setModel({
                original: mEditor.createModel(diff || "", props.language),
                modified: mEditor.createModel(value || "", props.language),
            })
        } else {
            (editor as mEditor.IStandaloneCodeEditor).setValue(value || "")
        }
    })

    return (
        <hope.div
            height="100%"
            ref={parent}
        />
    );
};

export default Monaco;
