/* Selfhosted Compass - the rabbit hole catalogue
 *
 * A burrow is a discovery prompt for a corner of the catalogue the main
 * questionnaire never mentions. Answering "yes" does not move you on, it takes
 * you down: the burrow opens with its projects and unlocks the neighbours
 * listed in `near`.
 *
 *   id    stable key, kept in localStorage
 *   r     realm id, used to steer the deck towards what you keep saying yes to
 *   c     category id (or ids) from data/apps.json the projects come from
 *   q     the prompt
 *   h     one line of why you might want it
 *   near  burrows unlocked by opening this one - the descent
 *   pin   optional project names pulled to the front of the burrow
 *   deep  true when the category itself is already covered by the questionnaire
 *         and this prompt is about the part of it that never gets named
 */

const BURROWS = [

/* ============================ MEDIA ============================ */
{ id:'b_scrobble', r:'media', c:'scrobble', near:['b_yearrev','b_mediastats','b_jukebox'],
  q:'Keep a lifetime log of every song you play?',
  h:'Your own Last.fm. Nobody sells the data, and it survives the next streaming service going under.' },

{ id:'b_yearrev', r:'media', c:'year-in-review', near:['b_mediastats','b_scrobble'],
  q:'Generate your own year in review?',
  h:'A Spotify Wrapped for the library you actually own — films watched, hours listened, the lot.' },

{ id:'b_posters', r:'media', c:'media-assets', near:['b_arrhelpers','b_mediastats'],
  q:'Make every poster in your library match?',
  h:'Fetches, crops and stamps artwork so your media server stops looking like a jumble sale.' },

{ id:'b_vidcut', r:'media', c:'video-editing', near:['b_convert','b_restream'],
  q:'Trim and shrink video without uploading it anywhere?',
  h:'Cut a clip, squeeze it under a size limit, hand it back — all on your own machine.' },

{ id:'b_ambient', r:'media', c:'ambient-sounds', near:['b_jukebox'],
  q:'Rain, a café and a fireplace on tap?',
  h:'An ambient noise mixer you can leave running on the server instead of a browser tab full of ads.' },

{ id:'b_asciinema', r:'media', c:'recording', near:['b_terminal','b_signage'],
  q:'Record your terminal as text instead of video?',
  h:'Sessions you can pause, copy from and embed — a tenth of the size of a screen capture.' },

{ id:'b_arrhelpers', r:'media', c:'arr', near:['b_posters','b_mediastats','b_indexers'],
  q:'Add the strange helpers the *arr crowd built?',
  h:'Fifty small tools that unstick queues, solve captchas, hunt missing episodes and tidy up after themselves.' },

{ id:'b_indexers', r:'media', c:['arr','file-transfer-peer-to-peer-filesharing'], deep:true, near:['b_arrhelpers'],
  q:'Run your own index of what is out there?',
  h:'Local search over torrent and Usenet sources instead of trusting whatever site is up this week.' },

{ id:'b_watchparty', r:'media', c:['media-streaming-multimedia-streaming'], deep:true, near:['b_browser','b_restream'],
  q:'Watch something together with people who are not in the room?',
  h:'A shared browser or player everyone can see and one person drives. Better than counting down to press play.' },

{ id:'b_restream', r:'media', c:['media-streaming-video-streaming'], deep:true, near:['b_signage','b_cams'],
  q:'Take one video feed and hand it out in every protocol?',
  h:'RTSP in, HLS, WebRTC and RTMP out. The plumbing behind cameras, live streams and digital signage.' },

{ id:'b_bookaudio', r:'media', c:['document-management-e-books'], deep:true, near:['b_transcribe','b_ils'],
  q:'Turn a book you own into an audiobook?',
  h:'Local text to speech across a whole e-book, so a long read becomes something for the commute.' },

{ id:'b_jukebox', r:'media', c:['media-streaming-audio-streaming'], deep:true, near:['b_scrobble','b_ambient'],
  q:'Build a house jukebox out of spare parts?',
  h:'Synchronised audio in several rooms, a queue anyone on the wifi can add to, hardware from the drawer.' },

/* ============================ FILES ============================ */
{ id:'b_s3', r:'files', c:'file-transfer-object-storage-file-servers', near:['b_dfs','b_registry','b_backupdeep'],
  q:'Run your own S3 bucket?',
  h:'Half the software written this decade speaks S3. Give it a bucket that lives in your own rack.' },

{ id:'b_dfs', r:'files', c:'sysadmin-distributed-filesystems', near:['b_s3','b_discovery'],
  q:'Spread one filesystem across several machines?',
  h:'Storage that survives a disk, or a whole box, going away — the part of a homelab that turns it into infrastructure.' },

{ id:'b_convert', r:'files', c:'file-conversion', near:['b_vidcut','b_pdfdeep','b_misc'],
  q:'Convert any file to any format, locally?',
  h:'The thing you currently do on a website full of adverts that keeps your upload.' },

{ id:'b_digrepo', r:'files', c:'document-management-institutional-repository-and-digital-library-software', near:['b_ils','b_archive'],
  q:'Run a real archive with citable, permanent records?',
  h:'What universities and museums use. Overkill for holiday photos, exactly right for a collection that must outlive you.' },

{ id:'b_shots', r:'files', c:'screenshots', near:['b_paste','b_shorten'],
  q:'Host your own screenshot drop?',
  h:'Press a key, get a link on your own domain, keep the file. No expiry, no watermark.' },

{ id:'b_dedupe', r:'files', c:['file-transfer-web-based-file-managers'], deep:true, near:['b_backupdeep','b_convert'],
  q:'Find the duplicate files quietly eating your disk?',
  h:'Every backup of a backup, every photo imported twice. Usually worth a surprising number of gigabytes.' },

{ id:'b_sign', r:'files', c:['document-management'], deep:true, near:['b_pdfdeep','b_forms'],
  q:'Sign a contract without an Adobe account?',
  h:'Send a document, collect signatures, keep the audit trail on your own server.' },

{ id:'b_pdfdeep', r:'files', c:['document-management'], deep:true, near:['b_convert','b_sign'],
  q:'Do the ugly PDF jobs nobody has a tool for?',
  h:'Split, merge, redact, OCR, un-rotate, strip a password you set yourself and forgot.' },

{ id:'b_archive', r:'files', c:['archiving-and-digital-preservation-dp'], deep:true, near:['b_digrepo','b_bookmarksdeep'],
  q:'Keep a copy of the web before it disappears?',
  h:'Pages you cite, articles you liked, whole sites — saved as they looked, not as a dead link.' },

{ id:'b_backupdeep', r:'files', c:['sysadmin-backups'], deep:true, near:['b_dfs','b_s3','b_disks'],
  q:'Move data between twenty different clouds from one command?',
  h:'The layer under most backup setups: one syntax for S3, WebDAV, SFTP, Drive and the rest.' },

/* ============================ HOME ============================ */
{ id:'b_voice', r:'home', c:['voice-assistant','internet-of-things-iot'], near:['b_transcribe','b_iotdeep'],
  q:'A voice assistant that never phones home?',
  h:'Wake word, speech to text and the answer all inside your own four walls.' },

{ id:'b_iotdeep', r:'home', c:['internet-of-things-iot'], deep:true, near:['b_voice','b_metrics','b_signage'],
  q:'Own the layer underneath your smart home?',
  h:'The broker, the flashed firmware and the device dashboards — so your bulbs stop needing a vendor cloud.' },

{ id:'b_cams', r:'home', c:['video-surveillance'], deep:true, near:['b_restream','b_disks'],
  q:'Do object detection on your cameras yourself?',
  h:'"A person, not a cat, at 3am" — computed on your box, with no monthly fee and no clips in someone else\'s bucket.' },

{ id:'b_workshop', r:'home', c:['manufacturing'], deep:true, near:['b_inventorydeep','b_maint'],
  q:'Run the machines in your workshop from the browser?',
  h:'3D printers, CNC, filament stock and the model library that goes with them.' },

/* ============================ NET ============================ */
{ id:'b_ldap', r:'net', c:'sysadmin-identity-management-ldap', near:['b_idp','b_ssodeep'],
  q:'One user directory that every service asks?',
  h:'Change a password once instead of in eleven admin panels. Lighter than its reputation these days.' },

{ id:'b_idp', r:'net', c:'sysadmin-identity-management-tools-and-web-interfaces', near:['b_ldap','b_ssodeep','b_secrets'],
  q:'Run "sign in with my homelab" as a real login provider?',
  h:'Your own OAuth and OIDC issuer, so other people\'s software can log people in against your users.' },

{ id:'b_alias', r:'net', c:'privacy', near:['b_secrets','b_mailnews','b_paywall'],
  q:'Give every website a different email address?',
  h:'One alias per signup. When one starts getting spam you know exactly who sold you, and you burn just that address.' },

{ id:'b_secscan', r:'net', c:'security', near:['b_waf','b_trouble','b_idp'],
  q:'Scan your own setup the way an attacker would?',
  h:'Headers, certificates, open ports, known-bad files. Better you find it on a Sunday than someone else on a Tuesday.' },

{ id:'b_waf', r:'net', c:['security'], deep:true, near:['b_secscan','b_proxydeep'],
  q:'Put a real firewall in front of your web apps?',
  h:'A layer that reads the requests instead of only the ports — bot filtering, rate limits, rules you can actually read.' },

{ id:'b_tunnel', r:'net', c:'proxy', near:['b_vpndeep','b_proxydeep','b_shorten'],
  q:'Publish one service without opening a single port?',
  h:'An outbound tunnel does the work. Useful behind CGNAT, on a mobile connection, or in a flat you do not control.' },

{ id:'b_netdoc', r:'net', c:'sysadmin-network-configuration-management', near:['b_cmdb','b_assets','b_trouble'],
  q:'Write down your network so future-you understands it?',
  h:'Which VLAN, which subnet, which cable, which switch port. The document you always mean to make.' },

{ id:'b_rdp', r:'net', c:'sysadmin-remote-desktop-clients', near:['b_terminal','b_webdesktop','b_panels'],
  q:'Reach a whole desktop from a browser tab?',
  h:'Screen sharing and remote control that does not route your family\'s support session through a company in another country.' },

{ id:'b_secrets', r:'net', c:['privacy','password-managers'], deep:true, near:['b_idp','b_alias'],
  q:'Store secrets for your software, not for your browser?',
  h:'API keys and database passwords with versioning and access rules, instead of a .env file you copied twice.' },

{ id:'b_proxydeep', r:'net', c:['web-servers'], deep:true, near:['b_tunnel','b_waf','b_status'],
  q:'Look past the three reverse proxies everyone names?',
  h:'Tunnel-and-proxy appliances, image proxies, edge gateways — the ones you meet once you outgrow the obvious pick.' },

{ id:'b_vpndeep', r:'net', c:['sysadmin-vpn','remote-access'], deep:true, near:['b_tunnel','b_rdp'],
  q:'Build a flat network across places you do not own?',
  h:'Mesh VPNs and coordination servers: every machine reaches every other, wherever they physically are.' },

{ id:'b_ssodeep', r:'net', c:['sysadmin-identity-management-single-sign-on-sso'], deep:true, near:['b_idp','b_ldap'],
  q:'Put one login in front of everything at once?',
  h:'A gate at the proxy, so even the admin panel that has no user accounts gets protected properly.' },

{ id:'b_dnsdeep', r:'net', c:['dns'], deep:true, near:['b_netdoc','b_trouble'],
  q:'Run DNS as infrastructure, not just as an ad blocker?',
  h:'Your own authoritative zones, split horizon, DNS over HTTPS, records that follow your containers around.' },

/* ============================ PROD ============================ */
{ id:'b_groupware', r:'prod', c:'groupware', near:['b_webmail','b_workspace','b_caldeep'],
  q:'Mail, calendar and contacts as one thing for a household?',
  h:'The unglamorous middle ground between a file sync box and a full office suite.' },

{ id:'b_km', r:'prod', c:'knowledge-management-tools', near:['b_workspace','b_searchdeep','b_notesdeep'],
  q:'Turn your notes into a graph instead of a pile?',
  h:'Blocks, backlinks and structured facts — for when folders stopped being enough about two years ago.' },

{ id:'b_workspace', r:'prod', c:'workspace', near:['b_km','b_groupware','b_webdesktop'],
  q:'One tab that holds docs, boards and databases together?',
  h:'The Notion shape, self-hosted. Handy when the alternative is four tools that do not know about each other.' },

{ id:'b_cron', r:'prod', c:'task-scheduling', near:['b_notify','b_hooks','b_maint'],
  q:'A cron that tells you when a job fails?',
  h:'Schedules with a web UI, logs, retries and an alert. Unlike crontab, which fails in complete silence.' },

{ id:'b_habit', r:'prod', c:'habit-tracking', near:['b_quantself','b_track'],
  q:'Tick off the same things every day and watch the streak?',
  h:'Habit tracking with the data staying on your side, which is the whole point of tracking a habit.' },

{ id:'b_design', r:'prod', c:'design', near:['b_frontends','b_diagrams'],
  q:'Design interfaces without a Figma seat?',
  h:'A real vector and prototyping tool in the browser, plus a component workbench for the code side.' },

{ id:'b_feedback', r:'prod', c:'feedback', near:['b_forms','b_engage','b_helpdesk'],
  q:'Let people vote on what you build next?',
  h:'A public board for ideas and complaints, so the roadmap argument happens once rather than in every thread.' },

{ id:'b_webdesktop', r:'prod', c:'web-desktop', near:['b_rdp','b_workspace','b_browser'],
  q:'A whole desktop inside a browser tab?',
  h:'Windows, a file manager and apps, served from your server. Strange, genuinely useful on a locked-down machine.' },

{ id:'b_clipboard', r:'prod', c:'clipboard', near:['b_paste','b_localsend'],
  q:'Share one clipboard across all your machines?',
  h:'Copy on the laptop, paste on the desktop, without a company in the middle holding both.' },

{ id:'b_latex', r:'prod', c:'latex', near:['b_digrepo','b_km'],
  q:'Write LaTeX together, in the browser?',
  h:'Thesis, paper or CV, compiled server-side, with someone else typing in the same document.' },

{ id:'b_notesdeep', r:'prod', c:['note-taking-editors','wikis'], deep:true, near:['b_km','b_paste'],
  q:'Look past the five note apps everyone recommends?',
  h:'Forty more, each opinionated in a different direction — single binary, plain files, blocks, outlines, wiki syntax.' },

{ id:'b_bookmarksdeep', r:'prod', c:['bookmarks-and-link-sharing'], deep:true, near:['b_archive','b_feeds'],
  q:'Keep the page, not just the link?',
  h:'Bookmark managers that archive a full copy, so the thing you saved is still there when the site is not.' },

{ id:'b_feeds', r:'prod', c:['feed-readers'], deep:true, near:['b_changedet','b_bookmarksdeep','b_comments'],
  q:'Make a feed out of something that has no feed?',
  h:'Bridges and scrapers that turn any site, account or mailing list back into RSS, the way it should have stayed.' },

{ id:'b_paste', r:'prod', c:['pastebins'], deep:true, near:['b_shots','b_clipboard','b_secrets'],
  q:'Send a password or a log that deletes itself after reading?',
  h:'One-shot, encrypted-in-the-browser paste. Much better than the chat window it would otherwise live in forever.' },

{ id:'b_searchdeep', r:'prod', c:['search-engines'], deep:true, near:['b_km','b_bi'],
  q:'Give your own data a real search engine?',
  h:'Typo-tolerant, instant search you point at your own documents, notes or database. A weekend, then everything is findable.' },

{ id:'b_caldeep', r:'prod', c:['calendar-contacts'], deep:true, near:['b_groupware','b_booking'],
  q:'Own the calendar and contacts your phone syncs with?',
  h:'A small CalDAV and CardDAV server is often a single container and the last one you ever need to touch.' },

/* ============================ COMM ============================ */
{ id:'b_mailnews', r:'comm', c:'communication-email-mailing-lists-and-newsletters', near:['b_marketing','b_blog','b_alias'],
  q:'Send a newsletter that is yours, not a platform\'s?',
  h:'Your list, your export, your unsubscribe page — and no per-subscriber pricing as it grows.' },

{ id:'b_sip', r:'comm', c:'communication-sip', near:['b_mta','b_chatdeep'],
  q:'Run an actual phone system?',
  h:'Extensions, voicemail, a doorbell that rings every handset in the flat. The deep end, and oddly satisfying.' },

{ id:'b_mta', r:'comm', c:['communication-email-mail-transfer-agents','communication-email-mail-delivery-agents'], near:['b_webmail','b_mailnews','b_mailclients'],
  q:'Build a mail server out of parts instead of a bundle?',
  h:'The transfer agent and the delivery agent, separately. Harder, but you finally understand what the all-in-one box was doing.' },

{ id:'b_xmpp', r:'comm', c:['communication-xmpp-servers','communication-xmpp-web-clients'], near:['b_chatdeep','b_irc'],
  q:'Use the chat protocol that outlived every startup?',
  h:'Twenty-plus years old, federated, still running. A server costs almost nothing and nobody can shut it down.' },

{ id:'b_webmail', r:'comm', c:'communication-email-webmail-clients', near:['b_mta','b_groupware','b_mailclients'],
  q:'Read your mail in your own browser tab?',
  h:'The webmail half, which the mail-server bundles hide from you and which you may well prefer to swap out.' },

{ id:'b_comments', r:'comm', c:'comments', near:['b_blog','b_feedback','b_feeds'],
  q:'Comments under your posts without Disqus watching?',
  h:'Lightweight, no third-party scripts, moderation you control. Bring the conversation back onto the page.' },

{ id:'b_irc', r:'comm', c:['communication-irc'], deep:true, near:['b_xmpp','b_chatops'],
  q:'Stay on IRC without staying online?',
  h:'A bouncer keeps your connection alive and replays what you missed. The original always-on chat client.' },

{ id:'b_chatdeep', r:'comm', c:['communication-custom-communication-systems'], deep:true, near:['b_xmpp','b_notify','b_sip'],
  q:'Look past the two obvious Slack replacements?',
  h:'Fifty more messengers: metadata-free, mesh, single-binary, or built for one very specific kind of group.' },

{ id:'b_notify', r:'comm', c:['communication-custom-communication-systems'], deep:true, near:['b_cron','b_status','b_chatops'],
  q:'Let your scripts reach your phone in one line?',
  h:'A push endpoint you curl. Backups, disk warnings, the doorbell — everything gets a voice for almost no effort.' },

{ id:'b_forumdeep', r:'comm', c:['communication-social-networks-and-forums'], deep:true, near:['b_comments','b_blog'],
  q:'Host a place for a group that is not a chat room?',
  h:'Forums, Q&A sites, small federated servers — threads that are still readable in a year, unlike scrollback.' },

/* ============================ DEV ============================ */
{ id:'b_baas', r:'dev', c:['development','backend'], near:['b_deploy','b_registry','b_flags'],
  q:'A backend you do not have to write?',
  h:'Database, auth, storage and an API generated from your schema. A weekend project becomes an evening one.' },

{ id:'b_deploy', r:'dev', c:'sysadmin-deployment-automation', near:['b_registry','b_runners','b_platform'],
  q:'Push to git and have the thing be running?',
  h:'Your own small Heroku, on your own hardware, with the build logs and the domain and TLS handled.' },

{ id:'b_frontends', r:'dev', c:'front-end', near:['b_design','b_themes','b_localai'],
  q:'Put a better face on a tool you already run?',
  h:'Standalone front ends for models, servers and services whose own UI is a config file or nothing at all.' },

{ id:'b_terminal', r:'dev', c:'terminal', near:['b_rdp','b_panels','b_asciinema'],
  q:'SSH from a browser tab?',
  h:'Terminal in the browser, with host lists and session recording. What you want at 11pm from a borrowed laptop.' },

{ id:'b_flags', r:'dev', c:'software-development-feature-toggle', near:['b_analyticsdeep','b_baas'],
  q:'Ship code switched off and flip it on later?',
  h:'Feature flags with targeting, so a deploy and a release stop being the same nerve-wracking moment.' },

{ id:'b_l10n', r:'dev', c:['software-development-localization','language'], near:['b_lang','b_frontends'],
  q:'Translate your project with other people?',
  h:'Where most open source translations actually happen. Suggestions, review, and a nudge when a string changes.' },

{ id:'b_registry', r:'dev', c:'container-registry', near:['b_deploy','b_s3','b_updates'],
  q:'Host your own container images?',
  h:'No pull limits, no waiting on someone else\'s CDN, and the images survive an account being closed.' },

{ id:'b_hooks', r:'dev', c:'webhooks', near:['b_cron','b_notify','b_automation'],
  q:'Catch a webhook and see what is actually in it?',
  h:'An inbox for HTTP callbacks, with replay and forwarding. Saves an afternoon every single integration.' },

{ id:'b_cmdb', r:'dev', c:'sysadmin-configuration-management-database', near:['b_netdoc','b_assets','b_maint'],
  q:'Keep a record of what runs where?',
  h:'Machines, services, owners, dependencies. Boring until the moment something breaks and nobody remembers.' },

{ id:'b_signage', r:'dev', c:'digital-signage', near:['b_dashdeep','b_restream'],
  q:'Turn a spare TV into a display board?',
  h:'Scheduled screens for a shop, a workshop or the hallway. Rotas, menus, the departures board you always wanted.' },

{ id:'b_qr', r:'dev', c:'qr-codes', near:['b_shorten','b_misc'],
  q:'Make QR codes that will not expire behind a paywall?',
  h:'Every free generator online is a redirect through someone\'s tracking domain. This one is a container.' },

{ id:'b_runners', r:'dev', c:'runners', near:['b_deploy','b_cideep','b_registry'],
  q:'Run your CI jobs on your own hardware?',
  h:'Your machine, your caches, your minutes. Especially worth it once builds are slow or need a GPU.' },

{ id:'b_scrape', r:'dev', c:'web-scraping', near:['b_changedet','b_feeds','b_automation'],
  q:'Get data out of a site that has no API?',
  h:'Click through the page once, get a scraper that keeps running. The gateway drug to home automation.' },

{ id:'b_devinfra', r:'dev', c:'development-infrastructure', near:['b_automation','b_baas','b_cron'],
  q:'Turn your scripts into internal tools with a UI?',
  h:'A form on top of a script, permissions and a schedule. Colleagues stop asking you to run things for them.' },

{ id:'b_cideep', r:'dev', c:['sysadmin-continuous-integration-continuous-deployment'], deep:true, near:['b_runners','b_deploy','b_iac'],
  q:'Look past the CI everyone already regrets?',
  h:'Pipelines defined as containers, GitOps controllers that pull instead of push, and runners for one specific box.' },

{ id:'b_dbdeep', r:'dev', c:['database-management'], deep:true, near:['b_bi','b_searchdeep','b_queue'],
  q:'Give yourself a decent front end for your databases?',
  h:'Browse, query, diagram and migrate without a paid desktop client and without memorising psql flags.' },

{ id:'b_apidepth', r:'dev', c:['software-development-api-management'], deep:true, near:['b_hooks','b_baas'],
  q:'Put a gateway in front of your own APIs?',
  h:'Auth, quotas, caching and a place to test calls, instead of the same middleware copied into three services.' },

/* ============================ AI ============================ */
{ id:'b_transcribe', r:'ai', c:'transcription', near:['b_voice','b_a11y','b_localai'],
  q:'Turn recordings into searchable text, offline?',
  h:'Meetings, voice notes, interviews and old tapes — transcribed on your own GPU, never uploaded.' },

{ id:'b_localai', r:'ai', c:['generative-artificial-intelligence-genai'], deep:true, near:['b_frontends','b_transcribe','b_automation'],
  q:'Look past the two names everyone mentions for local models?',
  h:'Servers, front ends, image pipelines and fine-tuning tools — the whole shelf below the obvious pick.' },

{ id:'b_automation', r:'ai', c:['automation'], deep:true, near:['b_hooks','b_scrape','b_cron'],
  q:'Wire two services together that were never meant to meet?',
  h:'Drag nodes, or write a small agent, and let it watch for the thing you keep checking by hand.' },

{ id:'b_changedet', r:'ai', c:['automation','network-utilities'], deep:true, near:['b_scrape','b_feeds','b_notify'],
  q:'Get told when a web page changes?',
  h:'Price drops, exam results, a policy quietly rewritten. Watch the element, get a push, ignore the rest of the page.' },

/* ============================ LIFE ============================ */
{ id:'b_subs', r:'life', c:'subscriptions', near:['b_moneydeep','b_maint','b_wish'],
  q:'See every subscription you forgot to cancel?',
  h:'One list with renewal dates and yearly totals. Usually pays for the server in the first month.' },

{ id:'b_travel', r:'life', c:'travel-organization', near:['b_gps','b_wish','b_photodeep'],
  q:'Keep a map of everywhere you have been?',
  h:'Trips, flights, hikes and the places you want to go next, on your own map instead of a timeline nobody owns.' },

{ id:'b_people', r:'life', c:'relationships', near:['b_caldeep','b_crmdeep','b_habit'],
  q:'A CRM for your friends and family?',
  h:'Birthdays, what you talked about last time, who you have not called in a year. Less cold than it sounds.' },

{ id:'b_cars', r:'life', c:'vehicles', near:['b_maint','b_iotdeep','b_track'],
  q:'Log every fill-up, service and repair on your car?',
  h:'Costs per kilometre, reminders before the MOT, and a full history to hand over when you sell it.' },

{ id:'b_wish', r:'life', c:'wish-lists', near:['b_subs','b_travel','b_shopdeep'],
  q:'A wish list the family can claim from without spoilers?',
  h:'Someone marks an item as taken, you never see it. Solves the December group chat entirely.' },

{ id:'b_garden', r:'life', c:'gardening', near:['b_recipedeep','b_csa','b_habit'],
  q:'Keep every plant alive on a schedule?',
  h:'What is planted where, when it was last watered, what to sow next month.' },

{ id:'b_track', r:'life', c:'tracking', near:['b_quantself','b_inventorydeep','b_datasette'],
  q:'Track something nobody has built an app for?',
  h:'The biggest and strangest shelf in the catalogue — 73 projects for logging one very specific thing very well.' },

{ id:'b_quantself', r:'life', c:['tracking','health-and-fitness'], deep:true, near:['b_habit','b_metrics','b_track'],
  q:'Put your sleep, weight and steps on your own dashboard?',
  h:'Pull the watch data off the vendor\'s cloud and graph it next to everything else you measure.' },

{ id:'b_inventorydeep', r:'life', c:['inventory-management'], deep:true, near:['b_assets','b_maint','b_track'],
  q:'Know what is in every box in the basement?',
  h:'Label the box, photograph the contents, search for the cable six months later and actually find it.' },

{ id:'b_moneydeep', r:'life', c:['money-budgeting-management'], deep:true, near:['b_subs','b_erp','b_bi'],
  q:'Look past the three budgeting apps everyone names?',
  h:'Sixty more: double-entry ledgers, invoicing, payment infrastructure, crypto, receipts, envelopes.' },

{ id:'b_gps', r:'life', c:['maps-and-global-positioning-system-gps'], deep:true, near:['b_travel','b_maptiles','b_cars'],
  q:'Log where you have been without Google doing it for you?',
  h:'Your phone posts to your own server. The timeline stays, the surveillance does not.' },

{ id:'b_maptiles', r:'life', c:['maps-and-global-positioning-system-gps'], deep:true, near:['b_gps','b_travel'],
  q:'Serve your own maps, routing and geocoding?',
  h:'Tiles, turn-by-turn and address search, offline. Heavy, and completely independent of anyone\'s API key.' },

{ id:'b_recipedeep', r:'life', c:['recipe-management'], deep:true, near:['b_garden','b_csa','b_inventorydeep'],
  q:'Plan meals from what is actually in the cupboard?',
  h:'Recipes, stock, shopping list and a scanner for the barcode. The kitchen half of a homelab.' },

/* ============================ WEB ============================ */
{ id:'b_blog', r:'web', c:'blogging-platforms', near:['b_ssg','b_comments','b_mailnews'],
  q:'Write in public again, on your own domain?',
  h:'From a single-binary microblog to a full publishing platform with a paid-membership option.' },

{ id:'b_ssg', r:'web', c:'static-site-generators', near:['b_blog','b_links','b_deploy'],
  q:'A site that is just files, and therefore never falls over?',
  h:'Markdown in, HTML out. Nothing to patch, nothing to breach, hosted anywhere including a spare Pi.' },

{ id:'b_platform', r:'web', c:'platform', near:['b_selfhostdeep','b_deploy','b_panels'],
  q:'Turn a spare box into an appliance with an app store?',
  h:'One install, then you add services by clicking. The fastest route from bare metal to something the household uses.' },

{ id:'b_links', r:'web', c:'landing-page', near:['b_ssg','b_shorten','b_blog'],
  q:'One link that holds all your other links?',
  h:'The bio-link page and the online CV, on your domain, without the free tier watching your visitors.' },

{ id:'b_engage', r:'web', c:'customer-engagement', near:['b_helpdesk','b_marketing','b_feedback'],
  q:'Chat widgets and product tours without a per-seat bill?',
  h:'The little bubble in the corner, the onboarding checklist, the in-app survey — all on your own domain.' },

{ id:'b_marketing', r:'web', c:'marketing', near:['b_mailnews','b_analyticsdeep','b_crmdeep'],
  q:'Marketing automation you actually own?',
  h:'Campaigns, journeys and lead scoring, with the contact list staying in your database.' },

{ id:'b_hr', r:'web', c:'human-resources-management-hrm', near:['b_erp','b_booking','b_assets'],
  q:'Run HR for a small team without a seat price?',
  h:'Leave requests, contracts, onboarding checklists. Dull, and the moment you have five people, necessary.' },

{ id:'b_paywall', r:'web', c:'paywalls', near:['b_archive','b_feeds','b_alias'],
  q:'Strip the consent walls off an article before you read it?',
  h:'A reader front end that removes the overlays and hands you the text. Pairs well with an archive.' },

{ id:'b_shopdeep', r:'web', c:['e-commerce'], deep:true, near:['b_erp','b_wish','b_engage'],
  q:'Sell something without paying a cut per transaction?',
  h:'Twenty-five shop platforms, from a one-file checkout link to a warehouse-scale commerce API.' },

{ id:'b_analyticsdeep', r:'web', c:['analytics'], deep:true, near:['b_bi','b_marketing','b_flags'],
  q:'Web analytics that need no cookie banner?',
  h:'Counts without identifiers. Faster pages, a shorter privacy policy and numbers you can still act on.' },

{ id:'b_helpdesk', r:'web', c:['ticketing'], deep:true, near:['b_engage','b_feedback','b_crmdeep'],
  q:'A shared inbox several people can work out of?',
  h:'Support mail that stops being one person\'s Gmail, with assignment, notes and a history per sender.' },

{ id:'b_crmdeep', r:'web', c:['customer-relationship-management-crm'], deep:true, near:['b_erp','b_people','b_marketing'],
  q:'Keep track of everyone you deal with, properly?',
  h:'Pipeline, notes and next actions — for a business, a club, or a freelance practice with too many threads.' },

{ id:'b_erp', r:'web', c:['resource-planning'], deep:true, near:['b_crmdeep','b_hr','b_shopdeep'],
  q:'Run a whole small business from one install?',
  h:'Accounting, stock, invoices, projects and payroll in a single system. A big commitment and sometimes the right one.' },

{ id:'b_booking', r:'web', c:['booking-and-scheduling'], deep:true, near:['b_caldeep','b_hr','b_forms'],
  q:'Let people book time with you without Calendly?',
  h:'Availability from your own calendar, a page you send, no free-tier branding on your booking link.' },

{ id:'b_forms', r:'web', c:['polls-and-events'], deep:true, near:['b_feedback','b_booking','b_sign'],
  q:'Collect answers without handing them to a form giant?',
  h:'Surveys, RSVPs, "when can everyone meet" polls and conditional forms — results landing in your own database.' },

{ id:'b_shorten', r:'web', c:['url-shorteners'], deep:true, near:['b_qr','b_links','b_shots'],
  q:'Shorten links on your own domain?',
  h:'Short URLs that still resolve in ten years because you are the one paying for the domain.' },

{ id:'b_cmsdeep', r:'web', c:['content-management-systems-cms'], deep:true, near:['b_blog','b_ssg','b_baas'],
  q:'Use a CMS as an API instead of as a website?',
  h:'Headless content: editors get a nice admin, your front end gets JSON, neither has to compromise.' },

/* ============================ OPS ============================ */
{ id:'b_srvmgmt', r:'ops', c:'server-management', near:['b_panels','b_metrics','b_updates'],
  q:'One screen that shows every machine you own?',
  h:'CPU, disks, temperature and containers across all hosts. Forty-six projects compete for this job; a few are excellent.' },

{ id:'b_metrics', r:'ops', c:['visualization','sysadmin-metrics-metric-collection'], near:['b_srvmgmt','b_bi','b_logdeep'],
  q:'Turn your server into graphs you will actually stare at?',
  h:'The collector, the time series database and the dashboard. Once it is up you will measure things for fun.' },

{ id:'b_mediastats', r:'ops', c:'statistics', near:['b_scrobble','b_yearrev','b_metrics'],
  q:'Statistics about your own usage?',
  h:'Who watched what, how much you listened, how far you ran. Numbers about you, computed on your hardware.' },

{ id:'b_editors', r:'ops', c:'sysadmin-editors', near:['b_terminal','b_idedeep'],
  q:'Settle on the editor you will live in?',
  h:'The classics and their modern descendants, packaged so you can try one over SSH tonight.' },

{ id:'b_panels', r:'ops', c:'sysadmin-control-panels', near:['b_srvmgmt','b_rdp','b_platform'],
  q:'Administer the whole box from a browser?',
  h:'Users, storage, updates, services and a terminal — for the machine with no monitor attached.' },

{ id:'b_updates', r:'ops', c:'updates', near:['b_registry','b_notify','b_srvmgmt'],
  q:'Get told the minute a container has an update?',
  h:'Nine projects that only watch registries and tell you. Unpatched containers are the most common way in.' },

{ id:'b_mailclients', r:'ops', c:'sysadmin-mail-clients', near:['b_webmail','b_mta'],
  q:'A mail client that is not a web app?',
  h:'Terminal and desktop clients, plus the sync tools for moving a mailbox between providers.' },

{ id:'b_queue', r:'ops', c:'sysadmin-queuing', near:['b_discovery','b_dbdeep','b_hooks'],
  q:'Put a queue between two of your services?',
  h:'The piece that makes a slow job stop blocking a web request. Small, old, extremely reliable software.' },

{ id:'b_time', r:'ops', c:'sysadmin-time-servers', near:['b_dnsdeep','b_discovery'],
  q:'Serve time to your own network?',
  h:'Certificates, logs and backups all assume the clock is right. Fifteen minutes of work, once.' },

{ id:'b_trouble', r:'ops', c:'sysadmin-troubleshooting', near:['b_netdoc','b_secscan','b_logdeep'],
  q:'See exactly what your network is doing?',
  h:'Packet captures, an intercepting proxy, a traceroute that keeps running. Where guessing stops.' },

{ id:'b_pkg', r:'ops', c:['sysadmin-packaging'], near:['b_buildorg','b_registry','b_deploy'],
  q:'Build a real package instead of curl piped into a shell?',
  h:'Turn a directory into a .deb or .rpm in one command. Your future self, on the rebuild, will be grateful.' },

{ id:'b_buildorg', r:'ops', c:['sysadmin-build-and-software-organization-tools','build-and-software-organization-tools'], near:['b_pkg','b_cideep','b_registry'],
  q:'Manage compilers and toolchains without losing your mind?',
  h:'Environment modules and reproducible build stacks, for the machine that has to hold four versions of everything.' },

{ id:'b_chatops', r:'ops', c:'sysadmin-chatops', near:['b_notify','b_irc','b_automation'],
  q:'Run your server from a chat window?',
  h:'A bot in your own chat that deploys, restarts and reports. Half serious infrastructure, half toy.' },

{ id:'b_maint', r:'ops', c:'maintenance', near:['b_assets','b_inventorydeep','b_cars'],
  q:'Keep a maintenance log for everything you own?',
  h:'Filters, belts, batteries and service intervals — for the house, the boiler, the bikes and the racks.' },

{ id:'b_discovery', r:'ops', c:'sysadmin-service-discovery', near:['b_queue','b_dfs','b_dnsdeep'],
  q:'Let services find each other without hardcoded IPs?',
  h:'A shared key-value store and health checks. The moment you have two hosts, this stops being over-engineering.' },

{ id:'b_vtt', r:'ops', c:'virtual-tabletop', near:['b_gamesdeep','b_tourney'],
  q:'Run a D&D night for people in three cities?',
  h:'Maps, fog of war, dice and tokens, hosted by you so the campaign does not end with a subscription.' },

{ id:'b_dashdeep', r:'ops', c:['personal-dashboards'], deep:true, near:['b_signage','b_srvmgmt','b_themes'],
  q:'Look past the four dashboards everyone screenshots?',
  h:'Thirty-five start pages, from a YAML file of bookmarks to a live board with widgets for every service you run.' },

{ id:'b_logdeep', r:'ops', c:['sysadmin-log-management'], deep:true, near:['b_metrics','b_trouble','b_status'],
  q:'Read your logs without SSH-ing anywhere?',
  h:'From a one-container container-log viewer to a full search stack. Pick the smallest one that answers your questions.' },

{ id:'b_iac', r:'ops', c:['sysadmin-configuration-management'], deep:true, near:['b_cideep','b_vmdeep','b_cmdb'],
  q:'Describe your infrastructure instead of clicking it?',
  h:'Rebuild the whole stack from a repository after a disk dies — and know it will come back the same.' },

{ id:'b_vmdeep', r:'ops', c:['sysadmin-virtualization'], deep:true, near:['b_iac','b_dfs','b_platform'],
  q:'Build machine images and dev VMs reproducibly?',
  h:'Small Kubernetes, image builders and hypervisor management for people who are not running a datacentre.' },

{ id:'b_assets', r:'ops', c:['sysadmin-it-asset-management'], deep:true, near:['b_maint','b_cmdb','b_inventorydeep'],
  q:'Know every device you own and when its warranty ends?',
  h:'Serial numbers, purchase dates, who has the laptop. For a family, a club or a small office.' },

{ id:'b_diagrams', r:'ops', c:['sysadmin-diagramming'], deep:true, near:['b_design','b_netdoc','b_km'],
  q:'Draw your architecture where the diagram lives with the code?',
  h:'Text-to-diagram renderers and whiteboards you can host, so the picture updates when the system does.' },

{ id:'b_status', r:'ops', c:['sysadmin-monitoring-status-pages'], deep:true, near:['b_notify','b_logdeep','b_proxydeep'],
  q:'Put up a status page for your own services?',
  h:'So the household can check whether it is the internet or you, before they come and find you.' },

{ id:'b_selfhostdeep', r:'ops', c:['self-hosting-solutions'], deep:true, near:['b_platform','b_panels','b_srvmgmt'],
  q:'Look past the two NAS operating systems everyone starts with?',
  h:'Twenty-five ways to turn hardware into a self-hosting appliance — from a slim Pi image to a full app store.' },

{ id:'b_idedeep', r:'dev', c:['software-development-ide-tools'], deep:true, near:['b_editors','b_terminal','b_baas'],
  q:'Move your development environment onto the server?',
  h:'Full IDE in the browser, notebooks and per-project workspaces, so any machine becomes your machine.' },

/* ============================ GAMES ============================ */
{ id:'b_gamesdeep', r:'games', c:'games', near:['b_tourney','b_vtt','b_retro'],
  q:'Games that live on a server, not in a launcher?',
  h:'Open source games you host for friends: factory builders, voxel worlds, chess servers, party games in a browser.' },

{ id:'b_tourney', r:'games', c:'tournaments', near:['b_gamesdeep','b_vtt','b_forms'],
  q:'Run a tournament bracket for your friends?',
  h:'Signups, seeding, rounds and the table on a page everyone can refresh instead of a photo of a whiteboard.' },

{ id:'b_retro', r:'games', c:['games-administrative-utilities-control-panels'], deep:true, near:['b_gamesdeep','b_vtt'],
  q:'Play your ROM collection from the sofa, over the network?',
  h:'Library management, in-browser emulation and low-latency streaming from the desktop upstairs.' },

/* ============================ LEARN ============================ */
{ id:'b_csa', r:'learn', c:'community-supported-agriculture-csa', near:['b_garden','b_recipedeep','b_shopdeep'],
  q:'Software for a food co-op or a veg box scheme?',
  h:'Shares, rotas, deliveries and member accounts. A whole shelf of software written for exactly this and nothing else.' },

{ id:'b_lang', r:'learn', c:'language', near:['b_l10n','b_transcribe','b_coursedeep'],
  q:'Learn a language, or translate, without sending the text abroad?',
  h:'A reader that teaches you from real texts, and a translation engine that runs beside it on the same box.' },

{ id:'b_ils', r:'learn', c:['document-management-integrated-library-systems-ils'], deep:true, near:['b_digrepo','b_bookaudio'],
  q:'Run an actual library, with a catalogue and loans?',
  h:'What real libraries use, and what a school, a club or a very serious collection can use just as well.' },

{ id:'b_coursedeep', r:'learn', c:['learning-and-courses'], deep:true, near:['b_lang','b_ils','b_conference'],
  q:'Teach something, or keep the whole internet offline for when you need it?',
  h:'Course platforms, flashcards and a compressed copy of Wikipedia that fits on a stick and needs no connection.' },

{ id:'b_conference', r:'learn', c:['conference-management'], deep:true, near:['b_forms','b_booking','b_coursedeep'],
  q:'Organise an event bigger than a dinner?',
  h:'Call for papers, schedule, voting and minutes. Used by conferences and by very organised local councils.' },

{ id:'b_genea', r:'learn', c:['genealogy'], deep:true, near:['b_digrepo','b_ils','b_photodeep'],
  q:'Put the family tree somewhere the whole family can edit?',
  h:'Sources, photos and dates in a proper genealogy database rather than one relative\'s hard drive.' },

/* ============================ MISC ============================ */
{ id:'b_misc', r:'misc', c:'miscellaneous', near:['b_convert','b_qr','b_slides'],
  q:'The drawer of small tools that do one thing?',
  h:'Eighty-three of them: encoders, formatters, generators, calculators. The page you will bookmark and use weekly.' },

{ id:'b_slides', r:'misc', c:['miscellaneous'], deep:true, near:['b_misc','b_resume','b_signage'],
  q:'Make slides out of plain text?',
  h:'A deck that lives in git, diffs properly and renders in a browser. No more emailing a 40 MB file around.' },

{ id:'b_resume', r:'misc', c:['miscellaneous'], deep:true, near:['b_links','b_misc'],
  q:'Build a CV that is not a Word file?',
  h:'Structured data in, a clean PDF and a shareable page out, versioned for each application.' },

{ id:'b_themes', r:'misc', c:'theme', near:['b_frontends','b_dashdeep'],
  q:'Reskin the tools you already run?',
  h:'Drop-in themes for the interfaces you stare at every day and have quietly resented for months.' },

{ id:'b_a11y', r:'misc', c:'accessibility', near:['b_transcribe','b_signage'],
  q:'Live captions for a room, without a cloud service?',
  h:'Speech to text on a screen, in real time, for a talk, a class or someone who needs it at the dinner table.' },

{ id:'b_browser', r:'misc', c:'web-browser', near:['b_watchparty','b_webdesktop','b_rdp'],
  q:'Run a browser on the server and drive it from a tab?',
  h:'Isolated, shareable, and it keeps whatever it downloads on the other side of the network from your laptop.' },

{ id:'b_mobileapps', r:'misc', c:['android','ios'], near:['b_localsend','b_track'],
  q:'Phone apps that talk only to your server?',
  h:'The small client side of self-hosting — apps whose only backend is the one you are already running.' },

{ id:'b_localsend', r:'misc', c:['file-transfer-single-click-drag-n-drop-upload'], deep:true, near:['b_clipboard','b_shots','b_mobileapps'],
  q:'Send a file to the laptop across the table?',
  h:'No cable, no cloud round trip, no account. It finds the other device on the wifi and sends it directly.' },

{ id:'b_icons', r:'misc', c:'icons', near:['b_themes','b_dashdeep'],
  q:'Wondering where all these logos come from?',
  h:'The icon set this site is built on. Handy the moment you build a dashboard of your own.' },

{ id:'b_photodeep', r:'files', c:['photo-galleries'], deep:true, near:['b_archive','b_travel','b_genea'],
  q:'Look past the three photo apps everyone compares?',
  h:'Forty more: pretty public galleries, heavy metadata catalogues, encrypted vaults and image processing servers.' },

{ id:'b_disks', r:'ops', c:['sysadmin-monitoring-status-pages','server-management'], deep:true, near:['b_backupdeep','b_dfs','b_srvmgmt'],
  q:'Notice a dying disk before it takes the data with it?',
  h:'SMART values, temperatures and scrub results, watched automatically. Disks nearly always warn you first.' },

{ id:'b_bi', r:'ops', c:['visualization','analytics'], deep:true, near:['b_datasette','b_dbdeep','b_metrics'],
  q:'Point a business intelligence tool at your own database?',
  h:'Questions in a UI, charts, scheduled reports — over the data you already have and have never really looked at.' },

{ id:'b_datasette', r:'life', c:['tracking','visualization'], deep:true, near:['b_bi','b_track','b_km'],
  q:'Publish a spreadsheet as a browsable, queryable site?',
  h:'Point it at a CSV or a SQLite file and get a searchable website with an API. Astonishingly useful for a small thing.' },

];

/* Extra entry points that are not questions.
   Categories the deck skips because a burrow there would only frustrate. */
const RH_SKIP_CATS = ['interface'];
