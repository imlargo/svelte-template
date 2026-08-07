# Filosofía y reglas

Este template resuelve lo aburrido de arrancar un proyecto de consultoría (auth, permisos, layout,
formularios) y se detiene ahí a propósito. No es un framework y no debería convertirse en uno. Las
reglas de abajo son las que mantienen eso cierto a medida que el proyecto crece — no son gustos de
estilo, cada una existe porque romperla tiene un costo concreto.

## 1. Solo lo que se usa

Cero exports sin consumidor, cero abstracciones "por si acaso". Si escribes algo para cuando lo
necesites, bórralo: la versión que escribas cuando lo necesites de verdad será mejor y costará lo
mismo. Borrar es borrar — mover un módulo a otra carpeta no lo borra, y añadirle un test tampoco lo
convierte en usado.

## 2. Cero barrels

Nada de `index.ts` que reexporte. Todo se importa por su ruta real: un barrel oculta de dónde
viene cada cosa y arrastra módulos al bundle.

Los aliases (`$components`, `$ui`, `$core`, `$hooks`, `$types`, `$utils`) sí se usan y no son lo
mismo: resuelven a un archivo concreto, así que no ocultan nada ni arrastran nada.

## 3. Una sola forma de hacer cada cosa

Un estilo de import, un patrón de estado async, un lugar para cada tipo de dato. La segunda forma
equivalente no da flexibilidad — da una decisión que se toma cada vez, y que alguien (o un agente)
termina tomando al azar.

## 4. `$state` a nivel de módulo está prohibido para datos de usuario

En SSR los módulos son singletons por proceso, no por request. Un `$state` exportado con datos de
usuario filtra datos entre usuarios — es la única de estas reglas cuya violación es un incidente de
seguridad y no una molestia. El estado por request va en `locals`, en `data` del `load`, o en
contexto de Svelte.

Si te encuentras escribiendo `if (browser)` alrededor de una mutación de estado global, eso no es
una guarda: es la señal de que el estado está en el sitio equivocado.

## 5. Deny by default

Rol desconocido → sin permisos. Ruta no declarada → denegada. Un olvido debe producir un 403, no
un acceso. Falla ruidoso y a la primera, no silencioso y en producción.

## 6. Borrar antes que abstraer

La tercera repetición justifica una abstracción. La primera y la segunda, no.

## 7. Idiomático antes que ingenioso

Si SvelteKit ya lo resuelve (`afterNavigate`, `load`, form actions, `page.url`), se usa eso. No se
reimplementa con `$effect` y estado auxiliar. `$effect` es una vía de escape para sincronizar con
algo externo a Svelte — no para comunicar componentes, no para derivar valores.

---

Ante ambigüedad real (dos soluciones razonables con impacto distinto), vale la pena pararse a
decidir en vez de elegir al azar. Un juicio de ingeniería rutinario no necesita este nivel de
ceremonia.
