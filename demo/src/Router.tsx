import { useStoreon } from '@storeon/solidjs'
import { State, Events } from './store'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  Container,
  Divider,
  Center,
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  CloseButton,
} from '@hope-ui/solid'
import FileForm from './FileForm'
import { ErrorBoundary, Show } from 'solid-js'
import FileDetails from './FileDetails'
import FileEditor from './FileEditor'

const Router = () => {
  const [state, dispatch] = useStoreon<State, Events>()
  return (
    <Container height="100%">
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink
            href="#"
            currentPage={!state.file}
            onClick={() => dispatch('home')}
          >
            Home
          </BreadcrumbLink>
          <BreadcrumbSeparator />
        </BreadcrumbItem>
        <Show when={state.file}>
          <BreadcrumbItem>
            <BreadcrumbLink
              href="#"
              currentPage={state.file && !state.ctx}
              onClick={() => dispatch('unparse')}
            >
              {state.file!.name}
            </BreadcrumbLink>
            <BreadcrumbSeparator />
          </BreadcrumbItem>
        </Show>
        <Show when={state.ctx}>
          <BreadcrumbItem>
            <BreadcrumbLink href="#" currentPage={!!state.ctx}>
              Details
            </BreadcrumbLink>
            <BreadcrumbSeparator />
          </BreadcrumbItem>
        </Show>
      </Breadcrumb>
      <Show when={state.error}>
        <Alert status="danger">
          <AlertIcon mr="$2_5" />
          <AlertTitle mr="$2_5">Something went wrong</AlertTitle>
          <AlertDescription>{state.error!.toString()}</AlertDescription>
          <CloseButton
            position="absolute"
            right="8px"
            top="8px"
            onClick={() => dispatch('hideError')}
          />
        </Alert>
        <Divider />
      </Show>
      <Center height="calc(100% - 10em)">
        <Show when={!state.file}>
          <FileForm />
        </Show>
        <Show when={state.file && !state.ctx}>
          <FileDetails file={state.file!} />
        </Show>
        <Show when={state.ctx}>
          <ErrorBoundary
            fallback={(err) => {
              console.error(err)
              dispatch('error', err)
              return <>{err.toString()}</>
            }}
          >
            <FileEditor ctx={state.ctx!} />
          </ErrorBoundary>
        </Show>
      </Center>
    </Container>
  )
}
export default Router
