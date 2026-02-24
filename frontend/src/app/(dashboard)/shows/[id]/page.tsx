import { ShowDetailsClient } from "@/components/shows/ShowDetailsClient";

interface ShowPageProps {
    params: {
        id: string;
    };
}

/**
 * ShowPage - Rota Dinâmica /shows/[id]
 * Atua como Server Component para passar o parâmetro ID para o Cliente.
 */
export default function ShowPage({ params }: ShowPageProps) {
    return <ShowDetailsClient showId={params.id} />;
}
