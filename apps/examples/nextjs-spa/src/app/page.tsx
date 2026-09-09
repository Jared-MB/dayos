import { Desktop } from "@dayos/core";
import { Info, NotepadText } from "lucide-react";
import { App } from "@/components/app";

export default function Page() {
  return (
    <Desktop className="h-dvh p-4 flex gap-4">
      <App icon={NotepadText} title="Notas" id="notes">
        Esta es una ventana
      </App>
      <App icon={Info} id="about" title="Acerca de">
        Arrastra mi cabecera. Arrastra mis bordes. Prueba el botón de maximizar.
      </App>
    </Desktop>
  );
}
