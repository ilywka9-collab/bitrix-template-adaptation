# Progress

## Что уже сделано

1. Исправлена проблема с SVG-иконками:
- Внешний спрайт переведен на inline-использование внутри `index.html`.
- Все `<use>` переведены на внутренние ссылки (`href="#id"` + `xlink:href="#id"`).

2. Обновлены шрифты:
- Старые файлы в `fonts/` удалены.
- Новые шрифты перенесены из `static/` в `fonts/`.
- Сгенерированы `woff2` и `woff` версии.
- Подключение в `css/fonts.css` приведено к кроссбраузерной схеме: `woff2 -> woff -> ttf`.
- Выполнен сабсет шрифтов (латиница + кириллица + базовая пунктуация), что существенно уменьшило размер `woff2`.

3. Приведен в порядок HTML:
- Исправлены ошибки `html-validate`.
- Добавлены `type` у кнопок, `aria-label` для иконок-кнопок/ссылок, правки формы и разметки загрузки файла.

4. Оптимизация изображений:
- Все `images/tmp/*.jpg` сконвертированы в `webp`.
- Ссылки в `index.html` переведены на `webp`.

5. Оптимизация JS-загрузки:
- Для скриптов выставлен `defer`.
- Убрана прямая загрузка `swiper-bundle.min.js` и `imask.js` из `index.html`.
- В `js/scripts.js` добавлена ленивая загрузка:
  - `Swiper` — при приближении секции `.history` к viewport.
  - `IMask` — при фокусе на `input[type=tel]`.

6. Удаление jQuery из критического пути:
- Полностью переписан `js/scripts.js` на vanilla JS.
- Удалено подключение `js/jquery-3.7.1.min.js` из `index.html`.

7. Оптимизация LCP-изображения (hero):
- Для hero-изображения выставлены `loading="eager"`, `fetchpriority="high"`, `decoding="async"`.
- Добавлены `preload`-ссылки на hero-изображения в `<head>`.

## Последние результаты Lighthouse (mobile)

- Базово (до оптимизаций):
  - Performance: **64**
  - LCP: **26.0s**
  - Speed Index: **7.8s**

- После этапа изображений/шрифтов/ленивой загрузки JS:
  - Performance: **77**
  - LCP: **5.1s**
  - Speed Index: **3.6s**

- После приоритизации hero-изображения (текущий результат):
  - Performance: **91**
  - LCP: **3.0s**
  - Speed Index: **3.0s**
  - TBT: **0ms**

Отчет: `lighthouse-mobile-after5`

## Что осталось (следующие шаги)

1. Уменьшить размер `index.html` (сейчас большой из-за inline SVG-спрайта).
2. Декомпозировать `styles.css` и выделить критический CSS.
3. Повторно прогнать Lighthouse desktop+mobile после следующих изменений.

## Последние изменения (текущий шаг)

1. SVG-спрайт вынесен из `index.html` во внешний `images/sprite.svg` с безопасной инъекцией:
- Добавлен `js/sprite-loader.js`, который:
  - загружает спрайт через `fetch`;
  - парсит SVG через `DOMParser`;
  - удаляет потенциально опасные элементы (`script`, `foreignObject`) и inline-обработчики `on*`;
  - отбрасывает небезопасные `href/xlink:href` (кроме `#...` и `http/https`).
- Путь к спрайту сделан универсальным на базе `document.currentScript` (устойчиво при переносе корневой папки проекта).

2. Разделение и отложенная загрузка CSS:
- `css/styles.css` разделен на:
  - `css/styles.css` (критическая часть),
  - `css/styles-deferred.css` (второстепенная часть).
- Подключение `styles-deferred.css` переведено в неблокирующий режим:
  - `rel="preload" as="style"` + переключение в `rel="stylesheet"` на `onload`,
  - `noscript` fallback для режима без JavaScript.

3. Проверки:
- `node --check js/sprite-loader.js` — OK.
- `node --check js/scripts.js` — OK.
- `html-validate index.html` — OK.

## Исправление инцидента со спрайтом (финал)

### Симптом
- После выноса спрайта часть SVG-иконок периодически не отображалась в Chrome/Safari.
- В консоли фиксировалась ошибка по `sprite.svg`: `blocked:origin`.

### Причина
- В локальном режиме браузер блокировал сетевую загрузку внешнего SVG-спрайта (origin/CORS-ограничения).

### Что сделано
1. Добавлен офлайн/fallback-источник спрайта:
- `js/sprite-fallback.js` содержит текст спрайта в `window.__SVG_SPRITE_TEXT`.

2. Обновлено подключение в `index.html`:
- `js/sprite-fallback.js` подключается перед `js/sprite-loader.js`.

3. Обновлен `js/sprite-loader.js`:
- приоритет: сначала инъекция из `window.__SVG_SPRITE_TEXT` (без сети),
- затем только при необходимости `fetch/XHR` как резервный путь.

4. Дополнительно:
- корневой тег `images/sprite.svg` приведен к валидному standalone-виду (`xmlns`, `xmlns:xlink`).

### Результат
- Иконки восстановлены и стабильно отображаются локально.
- Подтверждено пользователем: «теперь все ок».

## Продолжение оптимизации (текущий этап)

1. Снижена блокировка рендера в `index.html`:
- `css/swiper-bundle.min.css`, `css/swiper.css`, `css/fonts.css`, `css/styles-deferred.css` переведены на неблокирующую схему:
  - `rel="preload" as="style"` + переключение в `rel="stylesheet"` через `onload`.
- Добавлен `noscript` fallback со всеми соответствующими `<link rel="stylesheet">`.

2. Унифицировано подключение адаптивных CSS:
- `response_599.css`, `response_427.css`, `response_374.css` переведены на ту же `media="print, (max-width: ...)"` схему, как и остальные response-файлы.

3. Уменьшена блокировка HTML-парсинга в начале `<body>`:
- `js/sprite-fallback.js` и `js/sprite-loader.js` подключены с `defer`.

4. Проверки:
- `html-validate index.html` — OK.
- `node --check` для `js/sprite-loader.js`, `js/scripts.js`, `js/functions.js` — OK.

## Lighthouse после текущего этапа (локально)

Отчеты:
- `lighthouse-mobile-after8.report.html`
- `lighthouse-mobile-after8.report.json`
- `lighthouse-desktop-after8.report.html`
- `lighthouse-desktop-after8.report.json`

### Mobile (после текущих правок)
- Performance: **88**
- LCP: **3.3s**
- Speed Index: **3.2s**
- TBT: **0ms**
- FCP: **2.6s**
- CLS: **0.051**

Сравнение с предыдущим mobile (`after6`):
- было: Performance **89**, LCP **3.2s**, SI **3.2s**
- стало: Performance **88**, LCP **3.3s**, SI **3.2s**

### Desktop (после текущих правок)
- Performance: **98**
- LCP: **1.1s**
- Speed Index: **0.7s**
- TBT: **0ms**
- FCP: **0.7s**
- CLS: **0.007**

Сравнение с предыдущим desktop (`lighthouse-desktop-after`):
- было: Performance **93**, LCP **1.8s**, CLS **0.018**
- стало: Performance **98**, LCP **1.1s**, CLS **0.007**
