# Website media and visual-rights audit

Checked 15 October 2026 (America/Los_Angeles). Scope: the current `prototypes/3d-face` media playlist, copied movie audio/still, principal 3D assets, and YouTube integration. The owner plans to launch while in San Francisco and return to Ireland in mid-November. GitHub Pages is a proposed host. Treat the site as a public personal portfolio; its commercial purpose has not been finally specified.

This is a source-based clearance assessment, not a legal opinion, a ruling of infringement, or a licence. “Hold” below means do not treat an asset as cleared for launch. No rights holder has been contacted, no permission has been obtained, and no running-site assets were removed during this audit. Technical availability is not evidence of authorization. The earlier implementation work established playback only and did not establish publication rights.

## Launch decisions

| Current asset/use | Evidence | Recommended action before public launch |
| --- | --- | --- |
| *Joseph and the Amazing Technicolor Dreamcoat*, full 1999 film, native player from Internet Archive | `site-content.js` streams `joseph_202206/JOSEPH.mp4`. The item's public metadata contains no licence URL or grant for this use. Internet Archive expressly disclaims copyright-status guarantees. | **Hold/disable the full-film stream.** Obtain express full-feature website streaming rights, or replace with an authorized viewing link/official promotional clip. A DVD purchase, stage-performance licence, playable file or archive listing does not establish this permission. |
| “I am Iron Man” recording, 1.53 seconds | Local MP3 copied from a user-posted Voicy clip; source notes expressly preserve original film rights. No rights-holder licence established. | **Hold/replace or seek permission.** It is the film recording, not merely the words of a short phrase. Brevity and a free-download button do not establish clearance. An exception requires assessment of the actual use and jurisdiction. |
| Tony press-conference still | Copied from the image used in a GamesRadar article, with no licence allowing reuse on this portfolio. | **Hold/replace or license separately.** The article's ability to publish it does not grant its readers the same permission. |
| *The Shape of Speed — North Sails trim*, YouTube `2gA-3T-95YQ` | Embedded from “E W”, not a confirmed rights-holder account. No rights statement found in the inspected description. | **Unverified; seek confirmation or replace with a clearly authorized upload.** Ask North Sails/its designated distributor to confirm ownership, that upload's authorization, and portfolio embedding. Do not state that this upload is proven unlawful merely because its authorization is unknown. |
| *Carts of Darkness*, YouTube `zi-f_J6hV-g` | Published by the official NFB channel. NFB separately provides a conditional licence for its supplied website embed code. | **Strongest candidate to retain, with conditions.** Keep an official unmodified player; confirm the intended portfolio use if relying on NFB's personal/noncommercial grant. Add the required NFB link when using that grant. Distinguish the YouTube route from NFB's own player terms; do not infer that either permits downloading/rehosting. |
| Nathang30 Tony Stark head, atlas and adapted eyelids | Source listing and local notice: CC BY-NC-SA 4.0. Attribution and adaptation notes already exist. | **Conditional, not cleared for every portfolio use.** Get written confirmation that this particular portfolio use is allowed, or an appropriate additional licence; retain attribution, licence link and modification notices; distribute adapted model assets under the required licence. The licence does not automatically apply to all site code. Underlying character/likeness rights remain separate. |
| 2iemniak Mark VII suit/wireframe derivative | Live listing says CC BY; original downloaded notice says CC BY 3.0 but also prohibits commercial fan-art use. | **Resolve conflicting notices with the creator.** Preserve attribution and explain the exact portfolio use. Do not silently treat the asset as either unrestricted or as a standard CC BY-NC licence. Underlying Marvel rights are not supplied merely by the model author's licence. |
| Globe land outlines | Natural Earth expressly places its map data in the public domain. | **Keep.** Preserve the existing source note as provenance. This does not license unrelated imagery. |

There is no verified permission in the repository for public use of the film recording/still or full *Joseph* stream. The model licences and original notices are real evidence but have the qualifications above. The character likeness and branding deserve review if the site will promote services; a disclaimer does not itself create permission.

## Is every embeddable YouTube video OK?

No. There are three separate questions:

1. **Platform permission:** YouTube's terms permit showing videos through its embedded player and include a limited user-to-user licence for uses enabled through the service. This is meaningful permission when the uploader has the relevant rights; it is not an unlimited licence to download or republish files.
2. **Source authorization:** A person uploading someone else's work cannot confer rights they lack. A working embed is not proof of an authorized upload. Prefer the actual creator, studio, broadcaster or authorized distributor; investigate obvious doubts and respect restrictions/removal requests.
3. **Implementation:** The player and data must comply with YouTube's rules. Do not obscure/interfere with branding, controls, links or ads; respect minimum player dimensions, attribution and autoplay requirements.

A separate email is not normally necessary for each clearly authorized official upload displayed through the permitted, compliant player. That is different from declaring that any video with embedding enabled is legally safe.

The legal position also depends on jurisdiction. The Ninth Circuit's *Hunley v. Instagram* applied the server test to the display right; it is not a worldwide immunity for every form of video use, infringement theory or contract violation. EU decisions address authorization, knowledge of unlawful source material and circumvention of framing restrictions. Do not assume that an approach defensible in one US circuit remains sufficient after moving to Ireland.

## Code changes the audit identified

These are findings, not changes made in this research turn:

- `hud-youtube.js` places `.hud-media-play` over most of the YouTube iframe. YouTube prohibits elements in front of its embedded player and interference with player functions. Remove the in-player overlay; put any HUD controls outside the player, and let native YouTube controls handle playback.
- The small projected left-hand player should be reviewed against YouTube's minimum 200×200 viewport and usable-control requirement; the recommendation is 480×270 for 16:9. A large intrinsic iframe transformed into a very small visible player should not be assumed compliant. Use a poster preview opening an adequately sized player if necessary.
- `scripts/refresh_video_stats.py` scrapes public watch pages for counts. YouTube API-client policies prohibit obtaining scraped YouTube data. Replace this with the official Data API and compliant refresh/retention, or remove the external counts. The current saved snapshot must not be presented as live.
- Keep source attribution and platform links visible, and do not confuse the archive-hosted film with YouTube content. A separate privacy/cookie assessment is needed for third-party players and data collection; copyright clearance does not settle that issue.

## Permissions to request

For every request, identify yourself, the planned GitHub Pages/custom domain, public portfolio purpose (including any promotion of paid work), US launch/Ireland move, intended audience/territories, requested term, precise asset and source, duration/timecodes, audio-only versus audiovisual use, autoplay behavior, and a screenshot or private demo showing the HUD. State whether files are self-hosted, streamed from another host or displayed through the rights holder's official player. Ask for written approval of the exact use, required credits, any fee, and any third-party rights the grant excludes. Request worldwide website rights if that is the actual audience; do not assume a domestic licence covers worldwide access. Silence is not permission.

- **Joseph:** start with Universal's [media licensing portal](https://www.universalclips.com/) and identify the [official film](https://www.universalpicturesathome.com/movies/joseph-and-the-amazing-technicolor-dreamcoat). Ask to be routed to full-feature digital streaming/exhibition rights. A clips portal is a routing starting point, not proof that full-film rights are offered. Ask which entity can authorize the film, soundtrack and relevant ancillary rights together. A licence to stage your own production is not permission to stream the Donny Osmond film.
- **Iron Man recording, still, character/suit use:** Disney's licensing FAQ expressly routes Marvel films beginning with *Iron Man* (2008), and commercial/noncommercial Marvel IP requests, to **permissions@marvel.com**. Include all proposed uses separately. Ask about performer/likeness and music or other excluded clearances; do not assume a film-clip licence covers everything. The 3D artists must separately authorize rights they own where their existing licence is insufficient.
- **Shape of Speed:** contact [North Sails](https://www.northsails.com/en-fr/pages/faq-contact) and ask for its media/licensing contact or authorized distributor. “E W” can be asked for evidence of authorization, but its agreement alone would be insufficient if it does not own the rights.
- **Carts:** use the [NFB contact route](https://help.nfb.ca/contact-the-nfb/) to describe a public professional portfolio and ask whether the official YouTube or NFB embed is authorized for it. NFB's own embed terms require personal/noncommercial use, unmodified supplied code/player, a link back, and no implied endorsement; don't treat absence of ads as conclusive.
- **Models:** contact the creators through their source profiles with screenshots and the portfolio purpose. Ask the suit creator to reconcile the CC BY and fan-art notices. Clarify the head's NC permission and whether an additional commercial licence is available. Neither artist can grant Marvel/performer rights they do not control.

Permission-request template:

> I am seeking written permission to use [exact work/asset/timecodes] on [domain], a public personal portfolio demonstrating my web-development work. I will launch while based in California and then operate from Ireland; the site will be accessible [territories]. The proposed use is [official embed/native streaming/copied clip/still/modified model], for [term], with [autoplay, editing and hosting details]. Attached is the proposed presentation. Please confirm whether you control the required rights, whether this exact use is permitted, the fee and credit terms, and any music, performer, likeness or other permissions I must obtain separately. If this is not your department, please direct me to the appropriate rights holder.

For clearance confidence on the recognisable Marvel/RDJ presentation and any reliance on exceptions, obtain a qualified copyright/clearance lawyer's review. US fair use is fact-specific; Irish fair dealing has specific purposes and conditions. A personal site, free hosting, noncommercial intent, credits, or a one-second clip does not automatically satisfy either regime. Equally, this audit does not claim that every unlicensed use is necessarily unlawful.

## Primary sources

- [YouTube terms — permissions and user licences](https://www.youtube.com/t/terms)
- [YouTube required minimum functionality — player size, overlays, autoplay](https://developers.google.com/youtube/terms/required-minimum-functionality)
- [YouTube developer policies — scraping, attribution, player integrity](https://developers.google.com/youtube/terms/developer-policies)
- [Internet Archive rights guidance](https://archivesupport.zendesk.com/hc/en-us/articles/360014759692-Rights) and [the Joseph item](https://archive.org/details/joseph_202206)
- [NFB terms — sharing/embedding](https://help.nfb.ca/terms/) and [official Carts page](https://www.nfb.ca/film/carts_of_darkness/)
- [Disney Studios licensing FAQ](https://www.disneystudiolicensing.com/)
- [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) and [CC FAQ — NC and other rights](https://creativecommons.org/faq/)
- [Nathang30 head listing](https://sketchfab.com/3d-models/tony-stark-86c267264a2e4903b8c2bcc1b972cb74), [2iemniak suit listing](https://blendswap.com/blend/6708); original local notices `prototypes/3d-face/assets/NATHANG30-LICENSE.md` and `prototypes/3d-face/source-assets/mark7/BLENDSWAP_LICENSE.txt`
- [Natural Earth terms](https://www.naturalearthdata.com/about/terms-of-use/)
- [US Copyright Office: fair use](https://www.copyright.gov/fair-use/more-info.html)
- [Irish IPOI: copyright protection and exceptions](https://www.ipoi.gov.ie/en/types-of-ip/copyright1/understanding-copyright/copyright-protection/) and [consolidated Act, including amendments](https://www.ipoi.gov.ie/en/law-practice/legislation/copyright/copyright-acts/consolidated-copyright-act-2000.pdf)
- [Ninth Circuit: Hunley v. Instagram](https://cdn.ca9.uscourts.gov/datastore/opinions/2023/07/17/22-15293.pdf)
- [CJEU: GS Media summary](https://curia.europa.eu/jcms/upload/docs/application/pdf/2016-09/cp160092en.pdf) and [VG Bild-Kunst summary](https://curia.europa.eu/jcms/upload/docs/application/pdf/2021-03/cp210036en.pdf)
- [GitHub content-removal policy](https://docs.github.com/en/site-policy/content-removal-policies/submitting-content-removal-requests)

Detailed permission-route research is also saved in [media-permission-routes-2026-10-15.md](media-permission-routes-2026-10-15.md).
