# EduKids

Trabajo de Fin de Batxelor (Batxelor en Informática, Universitat Carlemany). Estudiante: Antonio Rivera Mérida. Tutor: Francesc Albuera Reverte.
Línea temática: experiencia de usuario y diseño centrado en el usuario.

EduKids es una aplicación web de matemáticas básicas para niños de 5 a 10 años, pensada para usarse con un dispositivo compartido y con un adulto que configura y revisa. El proyecto estudia cómo diseñar una interfaz que un niño pueda usar con autonomía, sin monedas, rankings ni recompensas, y que dé al adulto indicadores descriptivos de lo que ha pasado en cada sesión.

Demo en producción: https://edukids-blond.vercel.app (la ruta `/demo` no guarda datos).

## Estado a 16/11/2026

* Tres juegos con tres niveles cada uno: Atrapa el número, Carrera de números y Memory Numbers. Cinco retos fijos por actividad, comprobados en el servidor.
* Zona infantil con perfiles por alias, pantalla "Antes de empezar" con consejos de comodidad, botón de escucha en cada pantalla y valoración con cinco caras al terminar (Smileyometer).
* Zona de familias con acceso adulto, perfiles, configuración de juegos y nivel por perfil, y un panel básico: sesiones terminadas, primeras respuestas correctas sin pista, intentos con ayuda e interrupciones.
* Base de datos PostgreSQL con permisos por fila y funciones que validan las respuestas. En local se usa PGlite; en la nube, Supabase.
* Pruebas automáticas con `node:test` en `src/tests`.

## Qué no está hecho todavía

* Panel con indicadores completo (en curso).
* Revisión de seguridad de la base de datos antes de que ningún niño juegue fuera de mi entorno (permisos de las funciones antiguas, políticas de acceso y validación de la API).
* Evaluación con familias: preparada, sin datos de participantes todavía.
* Pruebas en tableta real a fondo y en horizontal.
* Integración continua: las pruebas se ejecutan en local, no en GitHub.

## Cómo ejecutarlo

Requisitos: Node.js reciente (probado con la versión 24).

```bash
cd src
npm ci
npm test
npm run dev
```

La aplicación queda en http://127.0.0.1:3000. Sin variables de entorno funciona en modo local, con una base de datos PGlite en `src/.data` (no se sube a Git). Para usar Supabase hace falta rellenar las variables de `src/.env.example`; las claves reales no se suben nunca.

Otros comandos: `npm run typecheck` y `npm run build`.

## Tecnologías y licencias

| Tecnología | Uso | Licencia |
|------------|-----|----------|
| Next.js 16.3.6 | Framework web | MIT |
| React 19.3.0 | Interfaz | MIT |
| TypeScript 7.0.2 | Lenguaje (desarrollo) | Apache-2.0 |
| @electric-sql/pglite 0.5.8 | PostgreSQL embebido en modo local | Apache-2.0 |
| @supabase/supabase-js 2.117.2 y @supabase/ssr 0.12.7 | Cliente de Supabase | MIT |
| tsx 4.23.15 | Ejecución de pruebas (desarrollo) | MIT |
| Supabase (servicio, plan gratuito) | Base de datos PostgreSQL, autenticación y permisos por fila en la nube | Servicio comercial con plan gratuito |
| Vercel (servicio, plan Hobby) | Alojamiento y despliegue | Servicio comercial con plan gratuito |
| GitHub | Control de versiones | Servicio comercial |

Las licencias de las bibliotecas son las que declara cada paquete (lectura del 16/11/2026). Licencia de este proyecto: pendiente de decidir.

## Estructura

```
docs/          Entregables y fichas de avance por sesión (docs/avances)
diagramas/     Diagramas de arquitectura y UML
prototipos/    Wireframes
src/           Aplicación (Next.js, React, TypeScript)
  app/         Rutas y API
  components/  Pantallas
  lib/         Lógica (juegos, datos, voz, niveles)
  supabase/    Migraciones SQL
  tests/       Pruebas
```

## Cómo se trabaja

Una rama por sesión de trabajo, una pull request con la descripción de lo probado y lo no probado, fusión con "Rebase and merge", despliegue automático en Vercel (producción desde `main`, vista previa por PR), prueba en producción y una ficha en `docs/avances`. Los cambios en la base de datos van en migraciones SQL con marcha atrás guardada fuera del repositorio.

## Uso de inteligencia artificial

El código, las pruebas los genera una IA (Claude Code, de Anthropic) a partir de mis indicaciones. Yo decido qué entra, ejecuto los comandos y las pruebas, compruebo el resultado y abro y fusiono las pull requests. Cada ficha de `docs/avances` indica qué hizo la IA y qué hice yo. La mascota Nubi y sus variantes están generadas con IA a partir de prompts míos.

## Privacidad y ética

* El repositorio no contiene datos de menores ni claves. La nube solo tiene datos de prueba.
* La participación de familias se hará con información previa y consentimiento por escrito, con alias y sin datos identificativos. El documento de información y consentimiento está en preparación y pendiente de revisión con el tutor.
* Los indicadores del panel describen lo que ocurre en el juego. No son una evaluación de capacidades ni sirven para comparar niños.
* No hay publicidad, compras, monedas ni rankings.

## Planificación

| Fase | Fechas | Estado |
|------|--------|--------|
| E1: propuesta inicial | hasta el 02/08/2026 | Entregado |
| E2: marco teórico y metodología | hasta el 11/10/2026 | Entregado |
| E3: entrega completa | 11/01 – 17/01/2027 | En curso |
| E4: depósito final | 08/02 – 14/02/2027 | Pendiente |
| Defensa | 08/03 – 21/03/2027 | Pendiente |

Última actualización: 16 de noviembre de 2026.
