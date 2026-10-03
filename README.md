# Наши двое — личный сайт для двоих

Мобильный сайт без фреймворков: HTML + CSS + JavaScript. Подходит для iPhone и отлично живёт на GitHub Pages. Для хранения данных и авторизации используется Supabase.

## Секретные коды

Я сгенерировал для вас два отдельных кода. Их лучше передать друг другу приватно и использовать как пароли двух аккаунтов Supabase. **Не добавляйте сами коды в GitHub и не вставляйте их в `config.js`.**

## 1. Создать Supabase

1. Открой https://supabase.com/ и создай новый проект.
2. В `Authentication -> Providers -> Email` оставь вход по Email/Password включённым.
3. В `Authentication -> Users` создай два аккаунта:
   - аккаунт 1: твой email, пароль `Mira-7Qm4-Ve2p`
   - аккаунт 2: её email, пароль `Lumi-8Kx3-Zr9t`
4. Для простоты можно отключить требование подтверждения email в настройках Auth, потому что это личный закрытый проект.
5. Открой `SQL Editor`, вставь содержимое `supabase/schema.sql` и нажми Run.

## 2. Заполнить config.js

Открой `config.js` и вставь:

```js
export const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
export const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

export const MEMBERS = {
  me: {
    label: 'Я',
    email: 'твой email',
    name: 'Ты'
  },
  her: {
    label: 'Она',
    email: 'её email',
    name: 'Она'
  }
};
```

Supabase URL и anon/public key можно взять в `Project Settings -> API`.

**Важно:** в GitHub можно хранить только `anon/public` key. Никогда не добавляй `service_role` key на сайт.

## 3. Проверить локально

Из папки проекта:

```bash
python3 -m http.server 8000
```

Открой в браузере `http://localhost:8000`.

## 4. Выложить на GitHub Pages

Создай новый GitHub repository, например `our-two-site`.

В терминале внутри папки проекта:

```bash
git init
git add .
git commit -m "first version"
git branch -M main
git remote add origin https://github.com/ТВОЙ_USERNAME/our-two-site.git
git push -u origin main
```

После этого на GitHub:

`Settings -> Pages -> Build and deployment -> Source: Deploy from a branch -> main -> /(root) -> Save`

GitHub выдаст адрес вида:

`https://ТВОЙ_USERNAME.github.io/our-two-site/`

Открываете его с iPhone и добавляете на экран «Домой» через Safari.

## Почему GitHub + Supabase

GitHub Pages умеет отлично отдавать сам сайт, но не является базой данных. Supabase хранит хотелки, события, отзывы, фразы и воспоминания, а также делает настоящую авторизацию.

## Что уже есть

Главная страница с ближайшим планом, счётчиками и последними событиями.

Хотелки с отметкой «выполнено».

Запланированные места с датой и временем.

Отзывы о ресторанах и кафе с рейтингом 1–10.

Смешные моменты.

История встреч с друзьями из других городов.

Идеи для свиданий.

Наши локальные фразы и мемы.

Маленькие радости.

Боковое меню по кнопке с тремя полосками.

Вход только по одному из двух секретных кодов, с отображением автора записи.
