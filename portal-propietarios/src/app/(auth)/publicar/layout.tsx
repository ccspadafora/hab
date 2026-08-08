import { PublishSteps } from '@/components/publicaciones/PublishSteps'

export default function PublishLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="section-label">Publicar inmueble</div>
      <PublishSteps />
      {children}
    </div>
  )
}
