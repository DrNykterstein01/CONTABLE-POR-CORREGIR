Contable1

## Ejecutable con Electron (Windows)

Pasos rápidos para desarrollar y crear un instalador ejecutable en Windows.

- Instalar dependencias:

```bash
npm install
```

- Ejecutar la app en modo desarrollo (dev server + Electron):

```bash
npm run electron:dev
```

- Construir el UI y empaquetar un instalador para Windows:

```bash
npm run build:prod
```

Notas:
- La app usa `localStorage` en el renderer, que seguirá funcionando cuando la app esté empaquetada.
- El contenido web se sirve desde `dist/index.html` cuando está empaquetado.
- Si quieres usar almacenamiento nativo más robusto, puedo añadir `electron-store` o usar `app.getPath('userData')`.

