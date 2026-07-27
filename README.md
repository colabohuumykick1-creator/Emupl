# EMUPLCOOM Bot

Bot aktualizuje istniejącą strukturę serwera Discord dla społeczności emulatorów:

- 17 ról administracyjnych, językowych, społecznościowych i platformowych,
- 6 kategorii oraz 32 kanały tekstowe i głosowe,
- prywatną strefę ekipy z odpowiednimi uprawnieniami,
- kanał `#weryfikacja` oraz dostęp do pozostałych kanałów przez rolę `Zweryfikowany`,
- regulamin, FAQ, powitanie i szablon zgłoszenia problemu,
- panel ról obsługiwany przyciskami,
- komendy `/setup` i `/emuplcoom`.

Komenda `/setup` nie usuwa ani nie przenosi kanałów i kategorii. Wyszukuje istniejące elementy po nazwie, aktualizuje ich ustawienia oraz odświeża wiadomości EMUPLCOOM. Na wyraźne życzenie właściciela może utworzyć tylko brakujący kanał `#o-gameloop`; wszystkie inne brakujące kanały są pomijane z ostrzeżeniem.

## 1. Utworzenie aplikacji Discord

1. Otwórz [Discord Developer Portal](https://discord.com/developers/applications).
2. Wybierz **New Application** i nadaj nazwę `EMUPLCOOM`.
3. Wejdź w **Bot**, utwórz bota i skopiuj token.
4. Jako avatar ustaw plik `assets/emuplcoom-logo.png` dołączony do projektu.
5. Nie publikuj tokenu i nie wklejaj go na Discordzie ani do repozytorium.
6. W **OAuth2 → URL Generator** zaznacz zakresy `bot` i `applications.commands`.
7. Na czas pierwszej konfiguracji zaznacz uprawnienie `Administrator` i dodaj bota na swój serwer.
8. W ustawieniach ról serwera przesuń rolę bota wysoko — ponad role, którymi ma zarządzać.

Bot nie wymaga włączania uprzywilejowanego **Message Content Intent**.

## 2. Instalacja

W folderze projektu uruchom:

```powershell
npm install
Copy-Item .env.example .env
```

Otwórz `.env` i ustaw:

```dotenv
DISCORD_TOKEN=token_bota
GUILD_ID=id_twojego_serwera
```

Aby skopiować identyfikator serwera, włącz w Discordzie **Tryb dewelopera**, kliknij serwer prawym przyciskiem i wybierz **Kopiuj identyfikator serwera**.

## 3. Uruchomienie

```powershell
npm start
```

Po pojawieniu się bota online wpisz na serwerze:

```text
/setup
```

Jeżeli komenda nie pojawia się na liście Discorda, zarejestruj ją ręcznie i ponownie uruchom bota:

```powershell
npm run register
npm start
```

Komenda jest dostępna tylko dla administratorów. Jej wykonanie aktualizuje wyłącznie elementy już istniejące na serwerze.

## Weryfikacja obsługiwana przez innego bota

Komenda `/setup` tworzy lub wykorzystuje rolę o dokładnej nazwie `Zweryfikowany` i ustawia dostęp tak, aby osoba bez tej roli widziała tylko `#weryfikacja`. Skonfiguruj swojego bota weryfikacyjnego, aby po poprawnej weryfikacji nadawał właśnie tę rolę.

Rola bota weryfikacyjnego musi znajdować się wyżej niż rola `Zweryfikowany` oraz posiadać uprawnienie **Zarządzanie rolami**. Istniejący kanał `#weryfikacja` zostanie zachowany i przeniesiony do kategorii `START`; indywidualne uprawnienia drugiego bota na tym kanale nie są usuwane.

Kanały językowe są widoczne zależnie od wybranych ról: `🇵🇱 Polski` odblokowuje `#chat-pl`, a `🇬🇧 English` odblokowuje `#chat-gb`. Osoba z obiema rolami widzi oba czaty.

## Bezpieczeństwo

- `.env` jest ignorowany przez Git i nie powinien być nigdzie wysyłany.
- Jeżeli token zostanie ujawniony, natychmiast zresetuj go w Developer Portal.
- Ról `👑 Właściciel` i `🛡️ Administrator` nie przypisuj osobom, którym nie ufasz — mają pełne uprawnienia.
- Bot niczego automatycznie nie usuwa.
- Regulamin blokuje udostępnianie pirackich ROM-ów, BIOS-ów i linków do nich.

## Hosting na Renderze (wariant bezpłatny)

Projekt zawiera gotowy `render.yaml` i endpoint kontrolny `/health`.

1. Umieść projekt w prywatnym repozytorium GitHub. Nie dodawaj pliku `.env`.
2. W Render wybierz **New → Blueprint** i połącz repozytorium.
3. Render wykryje usługę `emuplcoom-bot` jako bezpłatny Web Service.
4. Podczas tworzenia wpisz bezpiecznie dwie wymagane zmienne:
   - `DISCORD_TOKEN` — aktualny token bota,
   - `GUILD_ID` — identyfikator serwera Discord.
5. Poczekaj, aż w logach pojawią się komunikaty o zalogowaniu bota i działaniu `/health`.

Po wdrożeniu otrzymasz adres podobny do:

```text
https://emuplcoom-bot.onrender.com/health
```

W [cron-job.org](https://cron-job.org/) utwórz zadanie typu `GET` dla tego adresu wykonywane co 10 minut. Odpowiedź powinna mieć kod `200` i status bota.

Render usypia bezpłatny Web Service po 15 minutach bez ruchu przychodzącego. Bezpłatny limit wynosi 750 godzin na cały workspace w miesiącu, dlatego dwa stale działające serwisy mogą wyczerpać limit przed końcem miesiąca.
