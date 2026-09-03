- https://on-this-day-music.vercel.app/

```markdown
# On This Day Music

오늘과 같은 날짜에 처음 발매된 음악을 장르별로 보여주는 웹 프로젝트입니다.

## 배포 사이트


## 장르

- POP
- HIP-HOP
- R&B/SOUL
- ROCK

## 데이터 선정 기준

정확한 발매 정보를 제공하기 위해 다음 조건을 모두 만족하는 음악만 표시합니다.

- MusicBrainz에 최초 발매일이 `YYYY-MM-DD` 형식으로 등록된 작품
- 최초 발매일의 월·일이 오늘과 일치하는 작품
- Wikidata와 MusicBrainz가 연결된 작품
- Cover Art Archive에서 표지를 확인할 수 있는 작품

조건을 만족하는 작품이 없는 장르는 표시하지 않습니다.  
국가별 재발매, 리마스터 및 월 단위로만 등록된 불확실한 날짜는 제외합니다.

## 데이터 업데이트

GitHub Actions가 매일 한국 시간 기준으로 데이터를 갱신합니다.

수동 실행:

```bash
node scripts/update-daily.mjs
```

특정 날짜 확인:

```bash
MUSIC_DATE=09-01 FORCE_UPDATE=1 node scripts/update-daily.mjs
```

PowerShell:

```powershell
$env:MUSIC_DATE='09-01'
$env:FORCE_UPDATE='1'
node scripts/update-daily.mjs
```

## 데이터 출처

- [Wikidata](https://www.wikidata.org/)
- [MusicBrainz](https://musicbrainz.org/)
- [Cover Art Archive](https://coverartarchive.org/)

## 기술 구성

- HTML, CSS, JavaScript
- Node.js
- GitHub Actions
- Wikidata SPARQL API
- MusicBrainz API
- Cover Art Archive API

## 주의사항

외부 음악 데이터베이스에 등록된 정보만 사용하므로 실제 발매작이 있어도 데이터 연결, 정확한 날짜 또는 표지가 없으면 표시되지 않을 수 있습니다.
```
