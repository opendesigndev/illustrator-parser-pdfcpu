import { Alert, AlertDescription, AlertIcon, AlertTitle, VStack } from "@hope-ui/solid";

interface Props {
    err: Error
    title: string
}
export const ErrorScreen = ({ err, title }: Props) => {
    console.error(err)
    return (
        <VStack spacing="2em">
            <Alert
                status="danger"
                variant="subtle"
                flexDirection="column">
                <AlertIcon mr="$2_5" />
                <AlertTitle mr="$2_5">{title}</AlertTitle>
                <AlertDescription>
                    {err.toString()}
                </AlertDescription>
            </Alert>
        </VStack>
    )
}
