import { NextPageContext } from 'next';

function Error({ statusCode }: { statusCode?: number }) {
    return (
        <p>
            {statusCode
                ? `An error ${statusCode} occurred on server`
                : 'An error occurred on client'}
        </p>
    );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
    const statusCode = res?.statusCode ?? (err as any)?.statusCode ?? 404;
    return { statusCode };
};

export default Error;