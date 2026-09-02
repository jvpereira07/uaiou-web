import { Alert, Badge, Card } from "@/components/ui";
import { LogoutButton } from "@/components/logout-button";
import { documents } from "@/lib/api/endpoints";
import { formatDateTime } from "@/lib/format";
import { DocumentUpload } from "./document-upload";
import { documentLabel } from "./labels";
import { Brand } from "@/components/brand";

export const metadata = { title: "Cadastro em análise" };

/**
 * RF-W01.4 / critério de aceite 4 — usuário `pendente` para aqui. Não é uma versão limitada do
 * painel: é uma tela própria, porque um painel com tudo desabilitado só gera dúvida sobre o que
 * está quebrado.
 *
 * RF-06.1/RF-07.3 — e não é só um aviso: o cadastro **só entra na fila do admin depois que todos os
 * documentos exigidos foram enviados**. Sem o envio aqui, a conta ficaria pendente para sempre,
 * invisível para a moderação. É esta tela que fecha o ciclo do cadastro.
 */
export default async function PendingPage() {
  const docs = await documents.list();
  const missing = docs.missingTypes ?? [];
  const rejected = docs.documents.filter((doc) => doc.status === "rejected");
  const waiting = docs.documents.filter((doc) => doc.status === "pending");

  return (
    <main className="notice-shell">
      <div className="login-card" style={{ maxWidth: 520 }}>
        <div className="login-brand">
          <Brand size="hero" />
        </div>

        <Card title="Seu cadastro está em análise">
          {missing.length === 0 && rejected.length === 0 ? (
            <Alert tone="info">
              <p>
                Recebemos todos os documentos. Nossa equipe está conferindo — assim que a análise
                terminar, você recebe uma notificação e o painel é liberado.
              </p>
            </Alert>
          ) : (
            <Alert tone="warning" title="Falta enviar documento">
              <p>
                A análise só começa depois que todos os documentos chegarem. Envie o que falta
                abaixo.
              </p>
            </Alert>
          )}

          {docs.documents.length > 0 ? (
            <div className="stack" style={{ marginTop: "var(--space-4)" }}>
              {docs.documents.map((doc) => (
                <div key={doc.id} className="spread">
                  <span>{documentLabel(doc.type)}</span>
                  <span className="row">
                    <Badge
                      tone={
                        doc.status === "approved"
                          ? "success"
                          : doc.status === "rejected"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {doc.status === "approved"
                        ? "Aprovado"
                        : doc.status === "rejected"
                          ? "Recusado"
                          : doc.status === "superseded"
                            ? "Substituído"
                            : "Em análise"}
                    </Badge>
                    <span className="muted small">{formatDateTime(doc.createdAt)}</span>
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          {/* RF-06.5 — documento recusado mostra o motivo e permite reenviar; sem o motivo, a
              pessoa reenvia o mesmo arquivo e o ciclo se repete. */}
          {rejected.map((doc) => (
            <div key={doc.id} style={{ marginTop: "var(--space-4)" }}>
              <Alert tone="error" title={`${documentLabel(doc.type)} foi recusado`}>
                <p>{doc.rejectionReason ?? "Reenvie o documento com uma imagem mais legível."}</p>
              </Alert>
              <DocumentUpload type={doc.type} />
            </div>
          ))}

          {missing.map((type) => (
            <div key={type} style={{ marginTop: "var(--space-4)" }}>
              <DocumentUpload type={type} />
            </div>
          ))}

          {waiting.length > 0 && missing.length === 0 && rejected.length === 0 ? (
            <p className="muted small" style={{ marginTop: "var(--space-3)" }}>
              Se algum documento precisar de correção, o motivo aparece aqui e você poderá reenviar.
            </p>
          ) : null}

          <div style={{ marginTop: "var(--space-4)" }}>
            <LogoutButton />
          </div>
        </Card>
      </div>
    </main>
  );
}
