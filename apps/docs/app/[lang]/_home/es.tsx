/**
 * The landing page in Spanish. It sits beside the route that renders it, in the
 * language it is written in — the same shape as a doc page, which keeps its
 * `.mdx` next door for the same reason.
 *
 * TSX rather than MDX because this page is layout: a hero, a row of buttons and
 * a grid of cards. There is no prose here that Markdown would make easier to
 * write.
 */

import Link from "next/link";
import { CopyButton } from "../../_components/copy-button";

export default function Home() {
  return (
    <>
      <section className="hero">
        <h1>Ventanas, para React.</h1>
        <p className="hero-tagline">
          Un escritorio con ventanas arrastrables: iconos, ventanas que puedes
          mover, redimensionar y maximizar, y una pila de foco. Sin estilos
          propios y sin saber nada de rutas.
        </p>

        <div className="hero-actions">
          <Link className="button" href="/es/docs">
            Empezar
          </Link>
          <Link
            className="button"
            data-variant="secondary"
            href="/es/docs/api/core"
          >
            Referencia de la API
          </Link>
        </div>

        <div className="hero-install">
          <span>pnpm add @dayos/core</span>
          <CopyButton text="pnpm add @dayos/core" />
        </div>
      </section>

      <section className="feature-grid">
        <div className="feature">
          <h2>Sin estilos</h2>
          <p>
            El único CSS que define DayOS es estructural. El escritorio se
            posiciona y recorta, la ventana es una columna flex, y todo lo que
            se ve es tuyo.
          </p>
        </div>
        <div className="feature">
          <h2>Componible</h2>
          <p>
            Todos los componentes aceptan una prop <code>render</code> que
            cambia el elemento que emiten sin perder el comportamiento. Un icono
            puede ser un enlace.
          </p>
        </div>
        <div className="feature">
          <h2>Renderizado en servidor</h2>
          <p>
            Una ventana que está abierta durante el render del servidor llega al
            HTML con su contenido dentro, con el tamaño y la posición que tendrá
            una vez montada.
          </p>
        </div>
        <div className="feature">
          <h2>Ventanas con URL</h2>
          <p>
            El adaptador opcional de Next le da a cada ventana una ruta propia,
            así que la ventana de delante es la URL y el enlace se puede
            compartir.
          </p>
        </div>
      </section>
    </>
  );
}
