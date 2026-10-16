# Free official media candidates

Checked October 15, 2026 (America/Los_Angeles). Research only; no playlist changes or contacts made.

## Recommendation

Use the official Marvel YouTube player for an Iron Man trailer or interview instead of the separately hosted film audio/still. These candidates have primary-source provenance and currently pass YouTube's public embedded-player preview check. That is evidence of an intended free embedding route through YouTube, not a licence to download, extract audio, rehost, cover the player, or reuse artwork independently. It also does not license the rest of the site's Marvel character/likeness assets.

| Candidate | Official provenance | Public embed response | Best fit |
|---|---|---|---|
| [Marvel's Iron Man 3 Domestic Trailer (OFFICIAL)](https://www.youtube.com/watch?v=f_h95mEd4TI) | YouTube identifies uploader as verified Marvel Entertainment; [Marvel's film page](https://www.marvel.com/ironman3) publishes the official trailers. | `OK` | Cinematic replacement for the audio card. |
| [Iron Man — Official Trailer — Marvel Comics](https://www.youtube.com/watch?v=ccBQ9WfR2kU) | YouTube identifies uploader as verified Marvel Entertainment. Description promotes Marvel's Iron Man #1 and official Marvel channels. | `OK` | Short animated/comic alternative. |
| [Iron Man 15th anniversary discussion](https://www.youtube.com/watch?v=-bx4O7Ub1GY) | [Marvel's own May 23, 2023 article](https://www.marvel.com/articles/movies/iron-man-kevin-feige-jon-favreau-15-anniversary-interview?mibextid=Zxz2cZMarvel) directly embeds this exact YouTube ID and describes Feige/Favreau's discussion. | `OK` | Longer behind-the-scenes video, strongest direct website-to-video provenance. |
| [“I Am Iron Man.”](https://www.youtube.com/watch?v=wO471JtV06o) | YouTube search result identifies Marvel Entertainment as uploader (June 29, 2026). Unlike the first two, search did not expose the verification badge; inspect exact channel before choosing. | `OK` | Possible short replacement, but content/aspect ratio and uploader should be checked in browser first. |

## Joseph

No currently available, rights-holder-published **full 1999 film with free website embedding** was verified. Do not replace it with another anonymous full upload merely because it technically plays. The user's preference is the full 1999 film, not song excerpts; no excerpts were selected as replacements.

[Andrew Lloyd Webber's official Joseph page](https://www.andrewlloydwebber.com/show/joseph) currently promotes music and film clips, including Close Every Door and a making-of excerpt, not an unrestricted free full-film embed. Public/official song uploads exist, but they do not satisfy that full-film requirement. The earlier Internet Archive file still has no verified website streaming licence. Lack of a verified free option is not proof no such option exists; keep it out of the public playlist until a rights-holder route is established.

## Technical check and limits

Used `prototypes/3d-face/scripts/check_youtube_embed.py` against unauthenticated YouTube `/embed/ID?enablejsapi=1&origin=http%3A%2F%2F127.0.0.1%3A4188` responses with the matching localhost referrer. All four returned `previewPlayabilityStatus.status: OK`. HTML responses temporarily saved in `/private/tmp/official-marvel-*-embed.html`.

This preview result is **not** a full browser playback test, nor a guarantee for visitors in Ireland or elsewhere. Test actual playback on the final domain and preserve native controls, branding, ads, links and availability restrictions. The [YouTube terms](https://www.youtube.com/t/terms) expressly allow use of the embeddable player and provide limited service-feature-based permission; they do not turn uploaded media into freely reusable assets. [YouTube's player requirements](https://developers.google.com/youtube/terms/required-minimum-functionality) remain relevant to the HUD's player layout.

## Browser-verified, no-fee alternatives

The owner accepts replacing the inaccurate audio, wants embeds rather than outbound links, has no budget, and wants Joseph retained only if a full authorized film can be found. No such full-film option was verified. Do not substitute Joseph excerpts under its name.

Three stock YouTube iframes were tested at 560×315 with native controls and no covering HUD elements. Each loaded, accepted native play, and reported unmuted playback. Only one was played at a time. The Marvel trailer's current time was subsequently observed beyond 13 seconds. This tests playback on the current local site/browser, not universal availability in every territory.

| Candidate | Verified provenance/permission route | Runtime observed | Proposed use |
| --- | --- | --- | --- |
| [Flying Scot Main Sail Trim with Zeke Horowitz](https://www.youtube.com/watch?v=w3X6nvDdBx0) | Uploaded by Flying Scot Sailing Association; the exact video is embedded by [North Sails' official instructional article](https://www.northsails.com/blogs/north-sails-blog/video-flying-scot-sail-trim), which credits the association's collaboration. Use the official player under YouTube's service terms, not a downloaded copy. | 10:34 | Better-supported sailing replacement than the unverified E W upload. |
| [Tears of Steel](https://www.youtube.com/watch?v=R6MlUcmOul8) | Official Blender channel. The project's [own licence statement](https://mango.blender.org/about/) expressly authorizes sharing/showing under CC BY 3.0 with the credit scroll retained. Give title/creator/source/licence attribution, retain credits, and don't imply endorsement. | About 12:14 | Optional sci-fi replacement for the unavailable Joseph slot; not Joseph itself. |
| [Marvel's Iron Man 3 Domestic Trailer (OFFICIAL)](https://www.youtube.com/watch?v=f_h95mEd4TI) | Verified Marvel Entertainment channel, official promotional trailer. Normal YouTube embedding route; no separate permission to extract the soundtrack or stills. | 2:06 | Replace the copied 1.53-second audio/still with the complete official trailer embed. |

Playback evidence: `prototypes/3d-face/review/issue-12/free-official-media-check.png`. Temporary test HTML was removed; production playlist is unchanged by this research.

## How legitimate sites do this without a content budget

1. Use the platform's supplied embed for a rights-holder-published video. YouTube's [terms](https://www.youtube.com/t/terms) permit embedding and [help page](https://support.google.com/youtube/answer/171780) explains it. An authorized publisher supplies permission through the platform; this does not extend to downloading, extracting audio or republishing independent files.
2. Use works whose actual owners give a suitable open licence. CC BY allows commercial as well as noncommercial reuse with conditions; noncommercial-only licences require extra care for portfolios. [CC BY 4.0 explanation](https://creativecommons.org/licenses/by/4.0/) and [CC attribution guide](https://wiki.creativecommons.org/wiki/Recommended_practices_for_attribution). Follow the version actually specified for the work; Tears of Steel specifies 3.0.
3. Alternatively, request written permission. Asking can be free, but a response or free grant is not assured. Paid stock/commissioning is another common route, not necessary for the verified options above.

A site's mere use of film content is not evidence it is licensed. Some sites have contracts; some rely on a context-specific exception; some publish without clearance. None of those possibilities grants this project rights.

Before public integration, remove the YouTube interaction overlay, preserve native controls/branding/ads/links, respect [minimum dimensions](https://developers.google.com/youtube/terms/required-minimum-functionality), and replace scraped counts with the official API or omit them. Privacy-enhanced mode reduces personalization but is not a blanket exemption from [privacy and player rules](https://support.google.com/youtube/answer/171780). No-fee video options do not settle the separate model/character/likeness issues in the broader audit.
