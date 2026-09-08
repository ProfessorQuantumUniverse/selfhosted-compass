/* Selfhosted Compass - question catalogue
 *
 * GROUPS  sections of the questionnaire
 * NEEDS   one question each. Answer is yes / no / "already got it".
 *         alts[0] is the default recommendation when the user does not pick a variant.
 *         `i` refers to projects by their exact name in data/apps.json (string or array).
 * MUSTS   projects added automatically when the resulting stack calls for them.
 */

const GROUPS = [
  { id: 'media', ic: 'media', t: 'Media & Entertainment', s: 'Movies, music, books and photos from your own server instead of a subscription.' },
  { id: 'files', ic: 'files', t: 'Files, Photos & Documents', s: 'Your own cloud, real backups and a paperless household.' },
  { id: 'home',  ic: 'home', t: 'Smart Home & Workshop',   s: 'Home automation, cameras, energy, 3D printing.' },
  { id: 'net',   ic: 'net', t: 'Network, Access & Security', s: 'Ad blocking, reverse proxy, VPN, single sign-on, monitoring.' },
  { id: 'prod',  ic: 'prod', t: 'Productivity & Knowledge', s: 'Notes, wikis, tasks, bookmarks, passwords.' },
  { id: 'comm',  ic: 'comm', t: 'Communication',            s: 'Chat, mail, video calls, community.' },
  { id: 'dev',   ic: 'dev', t: 'Development',              s: 'Git hosting, CI/CD, IDE in the browser, databases, deployment.' },
  { id: 'ai',    ic: 'ai', t: 'AI & Automation',          s: 'Local language models, image generation, workflow automation.' },
  { id: 'life',  ic: 'life', t: 'Everyday Life & Hobby',    s: 'Recipes, money, inventory, sport, travel, collections.' },
  { id: 'web',   ic: 'web', t: 'Web, Business & Publishing', s: 'Website, shop, CRM, analytics, support.' },
  { id: 'learn', ic: 'learn', t: 'Knowledge, Culture & Learning', s: 'Offline Wikipedia, courses, libraries, genealogy, research.' },
  { id: 'ops',   ic: 'ops', t: 'Running the Server',       s: 'What keeps the whole stack manageable and alive.' },
];

/* Three questions that pre-decide most of the "which one?" follow-ups.
   Every alternative may carry t:'suite unix polish lean new proven' - the
   engine scores those against the answers here and pre-selects the winner.
   Nothing is locked in: the decisions step shows the pick and lets you
   overrule it. */
const TASTE = [
  { id:'shape', t:'One box that does everything, or a specialist per job?',
    h:'Decides between suites like Nextcloud and a stack of small tools that each do one thing.',
    o:[['suite','All-in-one','Fewer containers, more settings pages'],
       ['unix','A specialist per job','More containers, each better at its thing']], d:'unix' },
  { id:'weight', t:'Polish, or frugality?',
    h:'Decides between the option that feels like a product and the one that runs on anything.',
    o:[['polish','Polished, with apps','Costs RAM and CPU, feels finished'],
       ['lean','As light as it goes','Happy on a Pi, occasionally rough']], d:'polish' },
  { id:'age', t:'Newest that works, or boring and proven?',
    h:'Decides between the exciting fork and the thing that has been running quietly for a decade.',
    o:[['new','Newest that works','Features sooner, breakage sooner'],
       ['proven','Boring and proven','Stable for years, older interface']], d:'proven' },
];

const NEEDS = [
/* ============================ MEDIA ============================ */
{ g:'media', id:'m_video', fx:1, q:'Stream your own movies and TV shows?', h:'A media server with apps for TV, phone and browser — like Jellyfin or Kodi', tag:'Media Streaming - Multimedia Streaming',
  aq:'What does your living room look like?', alts:[
  { i:'Jellyfin', l:'Jellyfin', t:'polish proven', w:'The free standard, clients for everything' },
  { i:'Kodi', l:'Kodi', t:'lean proven', w:'Player running directly on the TV box' },
  { i:'Streamyfin', l:'Jellyfin + Streamyfin', t:'polish new', w:'Plus a polished mobile client' },
  { i:'Stash', l:'Stash', t:'unix', w:'For a heavily tagged personal collection' }]},

{ g:'media', id:'m_arr', fx:1, q:'Automate your media library?', h:'The famous *arr stack: search, grab, rename, file away — Sonarr, Radarr, Prowlarr', tag:'Media Management',
  aq:'What should arrive automatically?', alts:[
  { i:['Sonarr','Radarr','Prowlarr','Bazarr'], l:'Shows + movies (full stack)', t:'unix polish', w:'Sonarr, Radarr, Prowlarr and Bazarr for subtitles' },
  { i:['Sonarr','Prowlarr'], l:'TV shows only', t:'lean', w:'Sonarr plus the indexer manager' },
  { i:['Radarr','Prowlarr'], l:'Movies only', t:'lean', w:'Radarr plus the indexer manager' },
  { i:['Lidarr','Prowlarr'], l:'Music', t:'lean', w:'Lidarr plus the indexer manager' },
  { i:['Sonarr','Radarr','Prowlarr','Huntarr','Cleanuparr'], l:'Full stack + housekeeping', t:'unix new', w:'Adds Huntarr and Cleanuparr to fix stalled and missing items' }]},

{ g:'media', id:'m_req', q:'Let family and friends request titles themselves?', h:'A request portal in front of the *arr stack — Jellyseerr, Ombi', tag:'Media Management',
  alts:[{ i:'Jellyseerr', l:'Jellyseerr', t:'polish proven', w:'The widely used Overseerr fork for Jellyfin' },
        { i:'Seerr', l:'Seerr', t:'new', w:'The newer successor project' },
        { i:'Ombi', l:'Ombi', t:'proven', w:'Classic, supports many backends' }]},

{ g:'media', id:'m_torrent', fx:1, q:'Run a download client with a web interface?', h:'Torrent or Usenet — qBittorrent, SABnzbd, Transmission', tag:'File Transfer - Peer-to-peer Filesharing',
  aq:'Which network?', alts:[
  { i:'qBittorrent', l:'Torrent: qBittorrent', t:'polish proven', w:'The standard, excellent web UI' },
  { i:'Transmission', l:'Torrent: Transmission', t:'lean proven', w:'Ultra light on resources' },
  { i:'SABnzbd', l:'Usenet: SABnzbd', t:'polish', w:'Friendly interface, huge ecosystem' },
  { i:'NZBGet', l:'Usenet: NZBGet', t:'lean', w:'C++, runs on the smallest hardware' },
  { i:'slskd', l:'Soulseek: slskd', t:'lean new', w:'For obscure music you cannot find anywhere' }]},

{ g:'media', id:'m_music', fx:1, q:'Run your own music streaming service?', h:'Your FLAC and MP3 collection, Spotify style — Navidrome, Music Assistant', tag:'Media Streaming - Audio Streaming',
  aq:'What kind of listener are you?', alts:[
  { i:'Navidrome Music Server', l:'Navidrome', t:'lean proven', w:'Lightweight, works with every Subsonic app' },
  { i:'Music Assistant', l:'Music Assistant', t:'polish new', w:'Bridges your library and streaming services into Home Assistant' },
  { i:'koel', l:'Koel', t:'polish', w:'Beautiful web player' },
  { i:'OwnTone', l:'OwnTone', t:'lean proven', w:'AirPlay 2 and multi-room out of the box' },
  { i:'Funkwhale', l:'Funkwhale', t:'suite', w:'Federated, built for sharing' },
  { i:'AzuraCast', l:'AzuraCast', t:'suite polish', w:'A real internet radio station with scheduling' }]},

{ g:'media', id:'m_audio', q:'Manage audiobooks and podcasts?', h:'With progress sync across all your devices — Audiobookshelf', tag:'Media Streaming - Audio Streaming',
  alts:[{ i:'Audiobookshelf', l:'Audiobookshelf', w:'The clear favourite, with its own apps' }]},

{ g:'media', id:'m_books', fx:1, q:'Organise e-books, comics or manga?', h:'Library plus reader in the browser, sync to your e-reader — Calibre-Web, Kavita, Komga', tag:'Document Management - E-books',
  aq:'What do you read?', alts:[
  { i:'Calibre Web Automated', l:'Books (Calibre-Web Automated)', t:'polish new', w:'Calibre library with automatic import' },
  { i:'Kavita', l:'Mixed (Kavita)', t:'suite polish', w:'Books, comics and manga in one place' },
  { i:'Komga', l:'Comics / manga (Komga)', t:'lean proven', w:'Specialist with OPDS support' },
  { i:'Calibre', l:'Management only (Calibre)', t:'proven', w:'The desktop classic' }]},

{ g:'media', id:'m_yt', fx:1, q:'Archive YouTube channels or watch without ads?', h:'Subscribe and keep videos locally — Pinchflat, Tube Archivist, Invidious', tag:'Media Management',
  aq:'Archive or front end?', alts:[
  { i:'Pinchflat', l:'Archive: Pinchflat', t:'lean new', w:'Subscribes to channels, files them for Jellyfin' },
  { i:'Tube Archivist', l:'Archive: Tube Archivist', t:'suite', w:'Full text search and its own player' },
  { i:'MeTube', l:'Ad hoc: MeTube', t:'lean', w:'yt-dlp with a web front end' },
  { i:'Invidious', l:'Front end: Invidious', t:'proven', w:'Watch YouTube without the tracking' }]},

{ g:'media', id:'m_live', q:'Broadcast yourself — live stream or video platform?', h:'Your own Twitch or YouTube — Owncast, PeerTube', tag:'Media Streaming - Video Streaming',
  alts:[{ i:'Owncast', l:'Owncast', t:'lean new', w:'One container and you are live' },
        { i:'PeerTube', l:'PeerTube', t:'suite', w:'Federated video platform' },
        { i:'SRS', l:'SRS', t:'lean proven', w:'Streaming server for serious setups' },
        { i:'Restreamer', l:'Restreamer', t:'polish', w:'Put a camera online 24/7' }]},

{ g:'media', id:'m_game', fx:1, q:'Host game servers or retro games?', h:'Minecraft and friends, or your ROM collection — Pterodactyl, RomM, Sunshine', tag:'Games - Administrative Utilities & Control Panels',
  aq:'What do you have in mind?', alts:[
  { i:'Pterodactyl', l:'Game server panel', t:'suite proven', w:'Pterodactyl: spin up servers by clicking' },
  { i:'Pelican Panel', l:'Game servers (modern)', t:'new polish', w:'Pelican: the current fork' },
  { i:'RomM', l:'Retro library', t:'polish new', w:'RomM: manage ROMs and play them in the browser' },
  { i:'Sunshine', l:'Game streaming', t:'lean', w:'Sunshine: stream PC games to any device' },
  { i:'LinuxGSM', l:'Scripted servers', t:'lean proven', w:'LinuxGSM: command line management for 100+ games' }]},

/* ============================ FILES ============================ */
{ g:'files', id:'f_cloud', q:'Run your own file cloud with sync?', h:'A Dropbox replacement with mobile apps — Nextcloud, Seafile, Syncthing', tag:'File Transfer & Synchronization',
  aq:'How much do you want around it?', alts:[
  { i:'Nextcloud', l:'Nextcloud', t:'suite polish', w:'Everything: files, calendar, office, hundreds of apps' },
  { i:'Seafile', l:'Seafile', t:'lean proven', w:'Files only, but seriously fast' },
  { i:'Syncthing', l:'Syncthing', t:'lean unix proven', w:'Peer to peer sync with no central server at all' },
  { i:'OpenCloud', l:'OpenCloud', t:'lean new', w:'Lean modern successor to ownCloud' }]},

{ g:'files', id:'f_photos', q:'Replace Google Photos?', h:'Auto upload from the phone, faces, map, albums — Immich, PhotoPrism', tag:'Photo Galleries',
  aq:'What matters most?', alts:[
  { i:'Immich', l:'Immich', t:'polish new', w:'The Google Photos feeling including apps — the favourite' },
  { i:'PhotoPrism', l:'PhotoPrism', t:'lean proven', w:'Strong AI tagging, modest requirements' },
  { i:'Ente', l:'Ente', t:'polish new', w:'End to end encrypted' },
  { i:'Lychee', l:'Lychee', t:'lean', w:'Slim, pretty gallery for showing work' },
  { i:'Piwigo', l:'Piwigo', t:'lean proven', w:'Veteran gallery with heavy metadata support' }]},

{ g:'files', id:'f_docs', q:'Go paperless with your documents?', h:'Scan, OCR, full text search, tax folder — Paperless-ngx', tag:'Archiving and Digital Preservation (DP)',
  alts:[{ i:'Paperless-ngx', l:'Paperless-ngx', t:'polish proven', w:'The de facto standard' },
        { i:'Papra', l:'Papra', t:'lean new', w:'Minimal, modern alternative' },
        { i:'Docspell', l:'Docspell', t:'proven', w:'Powerful automatic filing rules' },
        { i:'Docling', l:'Docling', nx:1, t:'unix new', w:'Turns documents into clean data for an LLM' }]},

{ g:'files', id:'f_pdf', fx:1, q:'Edit, convert or sign PDFs?', h:'Everything you would otherwise upload to a sketchy website — Stirling-PDF', tag:'Document Management',
  aq:'What for?', alts:[
  { i:'Stirling-PDF', l:'PDF toolbox', t:'suite polish', w:'Stirling-PDF: 50+ tools, all local' },
  { i:'Docuseal', l:'Digital signatures', t:'unix', w:'DocuSeal: signing workflows' },
  { i:'ConvertX', l:'File conversion', t:'unix lean', w:'ConvertX: 1000+ formats' }]},

{ g:'files', id:'f_files', q:'Browse server files from the browser?', h:'Upload, share, poke around without SSH — copyparty, Filestash', tag:'File Transfer - Web-based File Managers',
  alts:[{ i:'copyparty', l:'copyparty', t:'lean unix', w:'One process, an absurd number of features' },
        { i:'Filestash', l:'Filestash', t:'polish', w:'Pretty, speaks S3, FTP and SFTP' },
        { i:'OpenList', l:'OpenList', t:'polish new', w:'One view across many cloud backends' },
        { i:'miniserve', l:'miniserve', t:'lean', w:'Single binary, running in seconds' }]},

{ g:'files', id:'f_share', q:'Send big files to other people?', h:'A WeTransfer replacement with expiring links — PicoShare, Gokapi', tag:'File Transfer - Single-click & Drag-n-drop Upload',
  alts:[{ i:'PicoShare', l:'PicoShare', t:'lean', w:'Tiny, no re-encoding, direct links' },
        { i:'Gokapi', l:'Gokapi', t:'lean', w:'Expiry dates and download limits' },
        { i:'Zipline', l:'Zipline', t:'polish new', w:'Great with ShareX and screenshots' },
        { i:'OnionShare', l:'OnionShare', t:'lean', w:'Anonymous, over Tor' }]},

{ g:'files', id:'f_secret', q:'Share passwords or secrets safely?', h:'A self-destructing link instead of a chat message — Yopass, PrivateBin', tag:'Pastebins',
  alts:[{ i:'Yopass', l:'Yopass', t:'lean', w:'Encrypted, one-time, self destructing' },
        { i:'PrivateBin', l:'PrivateBin', t:'lean proven', w:'The zero-knowledge classic' },
        { i:'Password Pusher', l:'Password Pusher', t:'polish', w:'Expiry plus an audit trail' }]},

{ g:'files', id:'f_backup', q:'Set up a real backup strategy?', h:'Encrypted, deduplicated, verified — Restic, Borg, Duplicati, Kopia', tag:'SysAdmin - Backups',
  aq:'What kind of person are you?', alts:[
  { i:'Backrest', l:'Restic + Backrest', t:'polish new', w:'Restic power with a web UI — the sweet spot' },
  { i:'BorgBackup', l:'BorgBackup', t:'lean proven', w:'Terminal classic, extremely efficient' },
  { i:'Kopia', l:'Kopia', t:'polish new', w:'Fast, cross platform, has a GUI' },
  { i:'Duplicati', l:'Duplicati', t:'polish proven', w:'Click driven, many cloud targets' },
  { i:'UrBackup', l:'UrBackup', t:'suite proven', w:'Client/server for whole PCs in the house' },
  { i:'Proxmox Backup Server', l:'Proxmox Backup Server', t:'suite proven', w:'The right answer if you run Proxmox VE' }]},

{ g:'files', id:'f_nas', q:'Use a ready-made NAS or server OS?', h:'Disks, shares and apps behind one interface — TrueNAS, OpenMediaVault, CasaOS', tag:'Self-hosting Solutions',
  aq:'Which flavour suits you?', alts:[
  { i:'OpenMediaVault', l:'OpenMediaVault', t:'proven', w:'Debian based, classic NAS' },
  { i:'TrueNAS', l:'TrueNAS', t:'suite proven', w:'ZFS, snapshots, replication' },
  { i:'CasaOS', l:'CasaOS', t:'polish new', w:'Friendly app store for the living room server' },
  { i:'Umbrel', l:'Umbrel', t:'polish new', w:'Beautiful home server OS, one click apps' },
  { i:'Tipi', l:'Runtipi', t:'polish new', w:'App store approach, very beginner friendly' },
  { i:'Yunohost', l:'YunoHost', t:'suite proven', w:'Domains, mail and backups included' },
  { i:'Cosmos', l:'Cosmos', t:'suite new', w:'App store, reverse proxy and auth in one' }]},

{ g:'files', id:'f_office', q:'Edit office documents in the browser?', h:'A Word and Excel replacement, also for working together — ONLYOFFICE, Collabora', tag:'Office Suites',
  alts:[{ i:'ONLYOFFICE', l:'ONLYOFFICE', t:'polish proven', w:'Best Microsoft Office compatibility' },
        { i:'Collabora Online Development Edition', l:'Collabora', t:'proven', w:'LibreOffice in the browser' },
        { i:'CryptPad', l:'CryptPad', t:'lean', w:'Encrypted and anonymous' },
        { i:'Grist', l:'Grist', t:'polish new', w:'Spreadsheets with database powers' }]},

/* ============================ SMART HOME ============================ */
{ g:'home', id:'h_ha', q:'Run a smart home hub without the cloud?', h:'Every vendor under one roof — Home Assistant, openHAB', tag:'Internet of Things (IoT)',
  alts:[{ i:'Home Assistant', l:'Home Assistant', t:'suite polish proven', w:'Number one, enormous ecosystem' },
        { i:'openHAB', l:'openHAB', t:'proven', w:'Java based, very strong rule engine' },
        { i:'Domoticz', l:'Domoticz', t:'lean proven', w:'Lightweight for small hardware' },
        { i:'Node RED', l:'Node-RED', t:'unix lean', w:'Wire your automations together visually' }]},

{ g:'home', id:'h_zigbee', fx:1, q:'Free your radio devices from vendor bridges?', h:'Zigbee, Z-Wave or your own ESP sensors — Zigbee2MQTT, ESPHome', tag:'Internet of Things (IoT)',
  aq:'Which radio technology?', alts:[
  { i:'Zigbee2MQTT', l:'Zigbee', w:'Zigbee2MQTT: every Zigbee device, one bridge' },
  { i:'Z-Wave JS UI', l:'Z-Wave', w:'Z-Wave JS UI: control panel plus MQTT gateway' },
  { i:'ESPHome', l:'DIY ESP devices', w:'ESPHome: sensors defined in YAML instead of code' },
  { i:'WLED', l:'LED strips', w:'WLED: addressable LEDs with effects and HA integration' }]},

{ g:'home', id:'h_cam', q:'Run security cameras without a vendor cloud?', h:'Recording, motion and object detection — Frigate, Scrypted', tag:'Video Surveillance',
  aq:'How clever should it be?', alts:[
  { i:'Frigate', l:'Frigate', t:'polish new', w:'AI object detection (person, car), Coral support' },
  { i:'Scrypted', l:'Scrypted', t:'polish new', w:'Best bridge to HomeKit, Google and Alexa' },
  { i:'motionEye', l:'motionEye', t:'lean proven', w:'Simple, happy on a Raspberry Pi' },
  { i:'Zoneminder', l:'ZoneMinder', t:'proven', w:'Veteran system for many cameras' },
  { i:'Viseron', l:'Viseron', t:'lean new', w:'Modular NVR with several detectors' }]},

{ g:'home', id:'h_energy', fx:1, q:'Track electricity, solar or an EV charger?', h:'Surplus charging and consumption history — evcc, Emoncms, Grott', tag:'Internet of Things (IoT)',
  aq:'What are you measuring?', alts:[
  { i:'evcc', l:'EV charging', w:'evcc: charge the car from solar surplus' },
  { i:'Emoncms', l:'Energy logging', w:'Emoncms: log and visualise power and temperature' },
  { i:'Grott', l:'Growatt inverter', w:'Grott: intercepts inverter data into MQTT' },
  { i:'Teslamate', l:'Tesla logging', w:'Teslamate: every drive, charge and battery stat' }]},

{ g:'home', id:'h_3d', fx:1, q:'Control a 3D printer or CNC machine?', h:'Web interface, webcam, job queue — OctoPrint, Mainsail, Fluidd', tag:'Manufacturing',
  aq:'What are you printing with?', alts:[
  { i:'Octoprint', l:'OctoPrint', t:'proven', w:'The classic with a huge plugin ecosystem' },
  { i:'Mainsail', l:'Mainsail (Klipper)', t:'polish new', w:'Modern Klipper front end' },
  { i:'Fluidd', l:'Fluidd (Klipper)', t:'lean new', w:'Klipper front end, very tidy' },
  { i:'Spoolman', l:'Spoolman', t:'unix lean', w:'Track filament spools and usage' },
  { i:'Manyfold', l:'Manyfold', t:'unix new', w:'Organise your STL collection' }]},

/* ============================ NETWORK ============================ */
{ g:'net', id:'n_dns', q:'Block ads and trackers for the whole network?', h:'A DNS filter that also covers the smart TV — Pi-hole, AdGuard Home', tag:'DNS',
  aq:'Which interface?', alts:[
  { i:'AdGuard Home', l:'AdGuard Home', t:'polish new', w:'Modern, DoH and DoT built in, simpler setup' },
  { i:'Pi-hole', l:'Pi-hole', t:'proven', w:'The classic with an enormous community' },
  { i:'Technitium DNS Server', l:'Technitium', t:'suite', w:'A full DNS server that also blocks' },
  { i:'blocky', l:'blocky', t:'lean', w:'Tiny, configured in YAML' }]},

{ g:'net', id:'n_proxy', q:'Give services proper domains and HTTPS?', h:'Reverse proxy with automatic Let\'s Encrypt — Nginx Proxy Manager, Traefik, Caddy', tag:'Web Servers',
  aq:'How do you like to configure things?', alts:[
  { i:'Nginx Proxy Manager', l:'Nginx Proxy Manager', t:'polish proven', w:'Click instead of type — the easy start' },
  { i:'Traefik', l:'Traefik', t:'unix new', w:'Discovers containers automatically through labels' },
  { i:'Caddy', l:'Caddy', t:'lean new', w:'Two lines of config, HTTPS handled for you' },
  { i:'Zoraxy', l:'Zoraxy', t:'suite new', w:'GUI plus tunnels and uptime checks' },
  { i:'Pangolin', l:'Pangolin', t:'new polish', w:'Expose services without opening a single port' }]},

{ g:'net', id:'n_vpn', q:'Reach your home network from anywhere?', h:'A VPN instead of open ports — WireGuard, Headscale, NetBird', tag:'SysAdmin - VPN',
  aq:'How much comfort do you want?', alts:[
  { i:'WireGuard', l:'Plain WireGuard', t:'lean proven', w:'Fast, lean, built into the kernel' },
  { i:'Headscale', l:'Headscale', t:'polish new', w:'Tailscale style mesh, punches through any NAT' },
  { i:'NetBird', l:'NetBird', t:'polish new', w:'Mesh with SSO and access rules' },
  { i:'Netmaker', l:'Netmaker', t:'suite new', w:'WireGuard mesh with a management UI' },
  { i:'Firezone', l:'Firezone', t:'polish new', w:'WireGuard with firewall rules and a web UI' },
  { i:'OpenVPN', l:'OpenVPN', t:'proven suite', w:'When you need maximum compatibility' }]},

{ g:'net', id:'n_sso', q:'One login for everything (SSO and 2FA)?', h:'Sign in once, even for apps with no user management — Authelia, Authentik', tag:'SysAdmin - Identity Management - Single Sign-On (SSO)',
  aq:'How big may it be?', alts:[
  { i:'Authelia', l:'Authelia', t:'lean', w:'Lightweight, sits in front of your reverse proxy' },
  { i:'Authentik', l:'Authentik', t:'suite polish', w:'Powerful: OIDC, SAML, LDAP, nice UI' },
  { i:'Pocket ID', l:'Pocket ID', nx:1, t:'lean new', w:'Minimal OIDC provider, passkeys only' },
  { i:'KeyCloak', l:'Keycloak', t:'suite proven', w:'The enterprise standard, plenty of Java' }]},

{ g:'net', id:'n_monitor', fx:1, q:'Find out when something breaks?', h:'Check availability and get notified — Uptime Kuma, Beszel, Grafana', tag:'SysAdmin - Monitoring & Status Pages',
  aq:'What do you want to watch?', alts:[
  { i:'Uptime Kuma', l:'Availability (Uptime Kuma)', t:'polish proven', w:'Set up in five minutes, 90+ notification channels' },
  { i:'Beszel', l:'Server resources (Beszel)', t:'lean new', w:'CPU, RAM and Docker stats, featherweight' },
  { i:'Netdata', l:'Everything live (Netdata)', t:'polish proven', w:'Per second metrics with zero configuration' },
  { i:['Grafana','Prometheus'], l:'The pro stack', t:'suite unix proven', w:'Grafana + Prometheus: any metric, any dashboard' },
  { i:'Zabbix', l:'Classic NMS (Zabbix)', t:'suite proven', w:'For many hosts and network gear' },
  { i:'Gatus', l:'Health dashboard (Gatus)', t:'lean new', w:'Status checks defined as code' }]},

{ g:'net', id:'n_dash', q:'Have one start page for all your services?', h:'Tiles with live status, weather and search — Homepage, Glance, Dashy', tag:'Personal Dashboards',
  aq:'How should it feel?', alts:[
  { i:'Homepage by gethomepage', l:'Homepage', t:'polish proven', w:'YAML config, pulls live data from 100+ services' },
  { i:'Glance', l:'Glance', t:'polish new', w:'Feeds, markets and weather — genuinely gorgeous' },
  { i:'Dashy', l:'Dashy', t:'polish proven', w:'Configure everything through the UI' },
  { i:'Homarr', l:'Homarr', t:'polish new', w:'Drag and drop with Docker integration' },
  { i:'Heimdall', l:'Heimdall', t:'lean proven', w:'Minimal and simply pretty' }]},

{ g:'net', id:'n_remote', q:'Reach desktops or terminals through the browser?', h:'SSH, RDP and VNC without installing a client — Guacamole, RustDesk', tag:'Remote Access',
  alts:[{ i:'Guacamole', l:'Apache Guacamole', t:'suite proven', w:'RDP, VNC and SSH in a browser tab' },
        { i:'RustDesk', l:'RustDesk', t:'polish new', w:'Self-hosted TeamViewer replacement' },
        { i:'Termix', l:'Termix', t:'lean new', w:'Modern SSH interface with a file editor' },
        { i:'MeshCentral', l:'MeshCentral', t:'suite proven', w:'Remote manage every machine in the house' }]},

{ g:'net', id:'n_sec', q:'Actively keep attackers out?', h:'The modern fail2ban, a WAF, intrusion detection — CrowdSec, Wazuh', tag:'SysAdmin - Monitoring & Status Pages',
  alts:[{ i:'CrowdSec', l:'CrowdSec', t:'polish new', w:'Blocks based on crowd-sourced intelligence' },
        { i:'SafeLine', l:'SafeLine', t:'polish new', w:'Web application firewall with a UI' },
        { i:'Wazuh', l:'Wazuh', t:'suite proven', w:'Full SIEM and XDR platform' },
        { i:'Anubis', l:'Anubis', nx:1, t:'lean new', w:'Keeps AI scrapers off your sites' }]},

{ g:'net', id:'n_net', q:'Know what is happening on your network?', h:'New devices, bandwidth, speed test history — NetAlertX, Speedtest Tracker', tag:'Network Utilities',
  alts:[{ i:'NetAlertX', l:'NetAlertX', w:'Alerts you about unknown devices on the LAN' },
        { i:'Speedtest Tracker', l:'Speedtest Tracker', w:'Evidence for the argument with your ISP' },
        { i:'UniFi Network Optimizer', l:'UniFi Network Optimizer', w:'WiFi scoring and security audit for UniFi setups' },
        { i:'UniFi Poller', l:'UniFi Poller', w:'UniFi metrics into Prometheus and Grafana' },
        { i:'WatchYourLAN', l:'WatchYourLAN', w:'Tiny network scanner' }]},

{ g:'net', id:'n_router', q:'Replace the router firmware or run a real firewall?', h:'OPNsense, pfSense, OpenWrt, IPFire', tag:'SysAdmin - Router',
  alts:[{ i:'OPNsense', l:'OPNsense', t:'polish new', w:'Modern FreeBSD firewall with frequent releases' },
        { i:'pfSense CE', l:'pfSense CE', t:'proven', w:'The long standing classic' },
        { i:'OpenWrt', l:'OpenWrt', t:'lean proven', w:'Turns cheap routers into real Linux boxes' },
        { i:'IPFire', l:'IPFire', t:'lean proven', w:'Hardened firewall distribution' }]},

{ g:'net', id:'n_ipam', q:'Document your network and IP addresses?', h:'Source of truth for racks, VLANs and subnets — NetBox, phpIPAM', tag:'SysAdmin - IT Asset Management',
  alts:[{ i:'Netbox', l:'NetBox', t:'suite proven', w:'The standard source of truth for infrastructure' },
        { i:'phpIPAM', l:'phpIPAM', t:'lean proven', w:'Focused, simple IP address management' },
        { i:'Nautobot', l:'Nautobot', t:'suite new', w:'NetBox fork with automation built in' },
        { i:'Snipe IT', l:'Snipe-IT', t:'polish proven', w:'Asset management for hardware and licences' }]},

/* ============================ PRODUCTIVITY ============================ */
{ g:'prod', id:'p_notes', q:'Keep notes in one place, synced everywhere?', h:'An Evernote or Notion replacement — Joplin, Memos, Trilium, SiYuan', tag:'Note-taking & Editors',
  aq:'How does your brain work?', alts:[
  { i:'Joplin', l:'Joplin', t:'polish proven', w:'Markdown, end to end encryption, apps everywhere' },
  { i:'Memos', l:'Memos', t:'lean new', w:'Fast micro notes, like a private Twitter' },
  { i:'TriliumNext Notes', l:'Trilium', t:'suite proven', w:'Huge interlinked knowledge trees' },
  { i:'SiYuan', l:'SiYuan', t:'polish new', w:'Block based like Notion, offline first' },
  { i:'AFFiNE Community Edition', l:'AFFiNE', t:'polish new', w:'Documents and whiteboard in one' },
  { i:'SilverBullet', l:'SilverBullet', t:'lean new', w:'Markdown notebook you can program' }]},

{ g:'prod', id:'p_wiki', q:'Write documentation that lasts?', h:'Guides, runbooks, team knowledge — BookStack, Outline, Wiki.js', tag:'Wikis',
  aq:'Who is it for?', alts:[
  { i:'BookStack', l:'BookStack', t:'polish proven', w:'Books, chapters, pages — instantly understandable' },
  { i:'Outline', l:'Outline', t:'polish new', w:'Very fast and polished, Notion feeling' },
  { i:'Wiki.js', l:'Wiki.js', t:'suite proven', w:'Modular, many auth and storage backends' },
  { i:'docmost Community Edition', l:'Docmost', t:'polish new', w:'Real-time collaborative editing' },
  { i:'Dokuwiki', l:'DokuWiki', t:'lean proven', w:'No database, runs forever' },
  { i:'TiddlyWiki', l:'TiddlyWiki', t:'lean proven', w:'A whole wiki in a single HTML file' }]},

{ g:'prod', id:'p_tasks', q:'Keep track of tasks and projects?', h:'To-do lists or a kanban board — Vikunja, Planka, Focalboard', tag:'Task Management & To-do Lists',
  aq:'How do you work?', alts:[
  { i:'Vikunja', l:'Vikunja', t:'suite polish', w:'List, kanban, gantt and calendar in one' },
  { i:'Planka', l:'Planka', t:'polish new', w:'Real-time Trello clone' },
  { i:'Focalboard', l:'Focalboard', t:'polish proven', w:'Boards, tables and calendars, Notion style' },
  { i:'Wekan', l:'Wekan', t:'proven', w:'The kanban veteran' },
  { i:'Super Productivity', l:'Super Productivity', t:'polish', w:'Personal, with time tracking and pomodoro' },
  { i:'Kanboard', l:'Kanboard', t:'lean proven', w:'Extremely frugal, plain PHP' }]},

{ g:'prod', id:'p_cal', q:'Host your own calendar and contacts?', h:'CalDAV and CardDAV for iPhone, Android and Thunderbird — Radicale, Baïkal', tag:'Calendar & Contacts',
  alts:[{ i:'Radicale', l:'Radicale', t:'lean proven', w:'Tiny, running in minutes' },
        { i:'Baïkal', l:'Baïkal', t:'lean proven', w:'Comes with a web admin interface' },
        { i:'Nextcloud', l:'Nextcloud', t:'suite polish', w:'The obvious choice if you run it anyway' },
        { i:'SOGo', l:'SOGo', t:'suite proven', w:'Groupware including ActiveSync' }]},

{ g:'prod', id:'p_book', q:'Save links and articles for later?', h:'A Pocket replacement that keeps an offline copy — Karakeep, linkding, Linkwarden', tag:'Bookmarks and Link Sharing',
  aq:'What are you collecting?', alts:[
  { i:'Karakeep', l:'Karakeep', t:'polish new', w:'Links, notes and images with AI tagging' },
  { i:'linkding', l:'linkding', t:'lean proven', w:'Blazing fast, minimal, browser extension' },
  { i:'LinkWarden', l:'Linkwarden', t:'polish new', w:'Archives pages permanently as PDF' },
  { i:'Wallabag', l:'Wallabag', t:'proven', w:'Pure reading view, exports to Kindle' }]},

{ g:'prod', id:'p_rss', q:'Read the news through RSS instead of an algorithm?', h:'A feed reader that syncs to every device — FreshRSS, Miniflux', tag:'Feed Readers',
  aq:'How many feeds?', alts:[
  { i:'FreshRSS', l:'FreshRSS', t:'polish proven', w:'The best all rounder, many client apps' },
  { i:'Miniflux', l:'Miniflux', t:'lean proven', w:'Minimalist, single binary, very fast' },
  { i:'RSSHub', l:'RSSHub', nx:1, t:'unix new', w:'Makes a feed out of sites that have none' },
  { i:'CommaFeed', l:'CommaFeed', t:'proven', w:'Google Reader nostalgia' }]},

{ g:'prod', id:'p_pw', q:'Run your own password manager?', h:'Works with the official Bitwarden apps — Vaultwarden', tag:'Password Managers',
  alts:[{ i:'Vaultwarden', l:'Vaultwarden', t:'lean polish proven', w:'Bitwarden server in Rust, tiny, all clients work' },
        { i:'Passbolt', l:'Passbolt', t:'suite', w:'Team oriented with fine grained sharing' },
        { i:'Psono', l:'Psono', t:'suite', w:'Enterprise features, many secret types' }]},

{ g:'prod', id:'p_time', q:'Track working time or projects?', h:'For invoices or for curiosity — Kimai, ActivityWatch', tag:'Time Tracking',
  alts:[{ i:'Kimai', l:'Kimai', t:'suite proven', w:'The classic, invoicing included' },
        { i:'solidtime', l:'solidtime', t:'polish new', w:'Modern, built for teams' },
        { i:'ActivityWatch', l:'ActivityWatch', t:'unix', w:'Automatically records what you do on the PC' },
        { i:'Wakapi', l:'Wakapi', t:'lean new', w:'WakaTime replacement for coding time' }]},

{ g:'prod', id:'p_search', q:'Search the web without being profiled?', h:'A meta search engine of your own — SearXNG', tag:'Search Engines',
  alts:[{ i:'SearXNG', l:'SearXNG', w:'Meta search, no ads, no profile' },
        { i:'MeiliSearch', l:'Meilisearch', w:'Instant search for your own apps' },
        { i:'Typesense', l:'Typesense', w:'Typo tolerant search engine' },
        { i:'Yacy', l:'YaCy', w:'Peer to peer web crawler' }]},

{ g:'prod', id:'p_paste', q:'Share code snippets or text?', h:'A pastebin or your own snippet library — Opengist, ByteStash', tag:'Pastebins',
  alts:[{ i:'Opengist', l:'Opengist', t:'polish new', w:'Like GitHub Gist, backed by real Git' },
        { i:'ByteStash', l:'ByteStash', t:'new', w:'Personal snippet library' },
        { i:'PrivateBin', l:'PrivateBin', t:'lean proven', w:'Encrypted, no account needed' }]},

{ g:'prod', id:'p_draw', fx:1, q:'Draw diagrams, sketches or whiteboards?', h:'Architecture drawings and brainstorming — Excalidraw, draw.io, PlantUML', tag:'SysAdmin - Diagramming',
  aq:'What kind of drawing?', alts:[
  { i:'Excalidraw', l:'Sketching (Excalidraw)', w:'Hand drawn feel, perfect for whiteboarding' },
  { i:'draw.io', l:'Diagrams (draw.io)', w:'The full featured diagram editor' },
  { i:'PlantUML Server', l:'From text (PlantUML)', w:'Diagrams generated from plain text' },
  { i:'WiseMapping', l:'Mind maps (WiseMapping)', w:'Classic mind mapping in the browser' }]},

/* ============================ COMMUNICATION ============================ */
{ g:'comm', id:'c_chat', q:'Run your own messenger or team chat?', h:'A Slack or Discord replacement — Matrix, Mattermost, Rocket.Chat', tag:'Communication - Custom Communication Systems',
  aq:'What matters to you?', alts:[
  { i:['Synapse','Element'], l:'Matrix (Synapse + Element)', t:'suite proven', w:'Open standard, federated, end to end encrypted' },
  { i:'Mattermost', l:'Mattermost', t:'polish proven', w:'Slack feeling, very mature' },
  { i:'Rocket.Chat', l:'Rocket.Chat', t:'suite', w:'Feature rich, includes customer chat' },
  { i:'Zulip', l:'Zulip', t:'polish proven', w:'Threads that actually work' },
  { i:'SimpleX Chat', l:'SimpleX', t:'lean new', w:'Maximum privacy, no accounts at all' }]},

{ g:'comm', id:'c_notify', q:'Push messages from your scripts to your phone?', h:'"Backup done", "door open", "server down" — ntfy, Gotify', tag:'Communication - Custom Communication Systems',
  alts:[{ i:'ntfy', l:'ntfy', t:'lean new', w:'A single curl command is enough' },
        { i:'Gotify', l:'Gotify', t:'lean proven', w:'Server plus app, very simple' },
        { i:'Apprise', l:'Apprise', t:'unix', w:'Fans out to 100+ services' }]},

{ g:'comm', id:'c_video', q:'Hold video calls without Zoom?', h:'Send a browser link and go — Jitsi Meet, BigBlueButton', tag:'Communication - Video Conferencing',
  alts:[{ i:'Jitsi Meet', l:'Jitsi Meet', t:'polish proven', w:'The standard, no account required' },
        { i:'MiroTalk SFU', l:'MiroTalk SFU', t:'lean new', w:'Light weight, many participants' },
        { i:'BigBlueButton', l:'BigBlueButton', t:'suite proven', w:'For teaching: whiteboard and breakout rooms' }]},

{ g:'comm', id:'c_mail', q:'Run your own mail server?', h:'Demanding, but doable — mailcow, Stalwart, Mail-in-a-Box', tag:'Communication - Email - Complete Solutions',
  aq:'How much hand work?', alts:[
  { i:'Mailcow', l:'mailcow', t:'suite polish', w:'Complete package with a UI, the community favourite' },
  { i:'Stalwart Mail Server', l:'Stalwart', t:'suite lean new', w:'Modern all-in-one server written in Rust' },
  { i:'docker-mailserver', l:'docker-mailserver', t:'lean unix', w:'Lean, configured through files' },
  { i:'Mail-in-a-Box', l:'Mail-in-a-Box', t:'suite proven', w:'One script, done' },
  { i:'SimpleLogin', l:'SimpleLogin', nx:1, w:'Only aliases, no full mail server' }]},

{ g:'comm', id:'c_forum', q:'Build a forum or community?', h:'Discussions, support, questions and answers — Discourse, Flarum', tag:'Communication - Social Networks and Forums',
  alts:[{ i:'Discourse', l:'Discourse', t:'suite polish proven', w:'The modern forum standard' },
        { i:'Flarum', l:'Flarum', t:'lean', w:'Light and fast' },
        { i:'NodeBB', l:'NodeBB', t:'polish', w:'Real-time discussions' },
        { i:'Answer', l:'Answer', t:'new', w:'Stack Overflow style Q&A' }]},

{ g:'comm', id:'c_social', fx:1, q:'Join the fediverse with your own instance?', h:'Alternatives to Twitter, Instagram and Reddit — Mastodon, Pixelfed, Lemmy', tag:'Communication - Social Networks and Forums',
  aq:'Which platform?', alts:[
  { i:'Mastodon', l:'Microblogging (Mastodon)', w:'The Twitter replacement' },
  { i:'PixelFed', l:'Photos (Pixelfed)', w:'Instagram for the fediverse' },
  { i:'Lemmy', l:'Link aggregator (Lemmy)', w:'Reddit for the fediverse' },
  { i:'Misskey', l:'Playful (Misskey)', w:'Lots of extras, highly customisable' }]},

{ g:'comm', id:'c_old', fx:1, q:'Run a classic chat protocol (IRC or XMPP)?', h:'Still the most frugal way to chat — The Lounge, ejabberd, Prosody', tag:'Communication - IRC',
  aq:'Which protocol?', alts:[
  { i:'The Lounge', l:'IRC (The Lounge)', w:'Always-on IRC client in the browser' },
  { i:'Ergo', l:'IRC server (Ergo)', w:'Modern IRCv3 server in one binary' },
  { i:'ejabberd', l:'XMPP (ejabberd)', w:'Rock solid XMPP server' },
  { i:'Snikket', l:'XMPP for families (Snikket)', w:'XMPP made easy, with apps' }]},

/* ============================ DEV ============================ */
{ g:'dev', id:'d_git', q:'Host your own GitHub?', h:'Repos, issues, pull requests, registry — Forgejo, Gitea, GitLab', tag:'Software Development - Project Management',
  aq:'How heavy may it be?', alts:[
  { i:'Forgejo', l:'Forgejo', t:'unix lean new', w:'Community fork of Gitea, light and non profit' },
  { i:'Gitea', l:'Gitea', t:'unix lean proven', w:'Very frugal, hugely popular' },
  { i:'GitLab', l:'GitLab CE', t:'suite proven', w:'Everything including CI/CD — needs RAM' },
  { i:'OneDev', l:'OneDev', t:'suite new', w:'Git, CI and kanban in a single binary' }]},

{ g:'dev', id:'d_ci', q:'Automate builds and deployments?', h:'Test and ship on every push — Woodpecker, Jenkins, Argo CD', tag:'SysAdmin - Continuous Integration & Continuous Deployment',
  alts:[{ i:'Woodpecker', l:'Woodpecker CI', t:'lean new', w:'Lightweight, pairs perfectly with Gitea and Forgejo' },
        { i:'Jenkins', l:'Jenkins', t:'suite proven', w:'Can do anything, has a plugin for everything' },
        { i:'ArgoCD', l:'Argo CD', t:'new', w:'GitOps for Kubernetes' },
        { i:'Concourse', l:'Concourse', t:'proven', w:'Pipelines defined as code' }]},

{ g:'dev', id:'d_paas', q:'Deploy apps with one click (your own Heroku)?', h:'git push and it runs, HTTPS included — Coolify, Dokku, CapRover', tag:'SysAdmin - PaaS',
  alts:[{ i:'Coolify', l:'Coolify', t:'suite polish new', w:'The current favourite: apps, databases, backups, SSL' },
        { i:'Dokku', l:'Dokku', t:'lean proven', w:'Minimalist, uses Heroku buildpacks' },
        { i:'CapRover', l:'CapRover', t:'polish proven', w:'One-click apps with a UI' }]},

{ g:'dev', id:'d_ide', q:'Have a development environment in the browser?', h:'Work on the same project from any device — code-server, Coder', tag:'Software Development - IDE & Tools',
  alts:[{ i:'code-server', l:'code-server', t:'lean proven', w:'VS Code in a browser tab, one container' },
        { i:'Coder', l:'Coder', t:'suite new', w:'Provision dev environments for a team' },
        { i:'JupyterLab', l:'JupyterLab', nx:1, t:'unix proven', w:'For data and notebooks' }]},

{ g:'dev', id:'d_db', fx:1, q:'Manage databases or use one as a backend?', h:'A GUI for SQL, or a whole backend — NocoDB, Baserow, PocketBase', tag:'Database Management',
  aq:'What do you need?', alts:[
  { i:'NocoDB', l:'Airtable style (NocoDB)', w:'Tables with views and automations' },
  { i:'Baserow', l:'Airtable style (Baserow)', w:'Open core, very clean UI' },
  { i:'Adminer', l:'SQL GUI (Adminer)', w:'One PHP file, every database' },
  { i:'CloudBeaver', l:'SQL GUI (CloudBeaver)', w:'DBeaver in the browser' },
  { i:'PocketBase', l:'Backend (PocketBase)', w:'Database, auth and API in one binary' },
  { i:'Directus', l:'Headless (Directus)', w:'Wraps any existing SQL database' }]},

{ g:'dev', id:'d_api', q:'Test, publish or protect APIs?', h:'A Postman replacement or an API gateway — Hoppscotch, Kong', tag:'Software Development - API Management',
  alts:[{ i:'Hoppscotch Community Edition', l:'Hoppscotch', t:'polish new', w:'Postman replacement in the browser' },
        { i:'Kong', l:'Kong', t:'suite proven', w:'The API gateway' },
        { i:'Svix', l:'Svix', nx:1, t:'unix new', w:'Reliable webhook delivery' }]},

{ g:'dev', id:'d_err', q:'Monitor errors and performance of your apps?', h:'Collect stack traces and traces — Sentry, GlitchTip', tag:'Software Development - Testing',
  alts:[{ i:'Sentry Self-Hosted', l:'Sentry', t:'suite proven', w:'The standard for error tracking' },
        { i:'GlitchTip', l:'GlitchTip', t:'lean new', w:'Sentry compatible and far lighter' },
        { i:'Langfuse', l:'Langfuse', nx:1, t:'new', w:'When you are building LLM applications' }]},

{ g:'dev', id:'d_low', q:'Build internal tools without much code?', h:'Admin panels, forms, dashboards — Appsmith, ToolJet, Budibase', tag:'Software Development - Low Code',
  alts:[{ i:'Appsmith', l:'Appsmith', t:'polish proven', w:'Drag and drop on top of your data sources' },
        { i:'ToolJet', l:'ToolJet', t:'polish new', w:'Similar, very actively developed' },
        { i:'Budibase', l:'Budibase', t:'suite', w:'Comes with its own database' }]},

/* ============================ AI ============================ */
{ g:'ai', id:'a_llm', q:'Run language models locally?', h:'A ChatGPT replacement on your own hardware — Ollama, Open WebUI', tag:'Generative Artificial Intelligence (GenAI)',
  aq:'Which combination?', alts:[
  { i:['Ollama','Open-WebUI'], l:'Ollama + Open WebUI', t:'polish proven', w:'The standard stack: model runner plus a proper chat UI' },
  { i:'LocalAI', l:'LocalAI', t:'lean unix', w:'OpenAI compatible API as a drop-in replacement' },
  { i:'AnythingLLM', l:'AnythingLLM', t:'suite polish', w:'Chat with your own documents' },
  { i:'LibreChat', l:'LibreChat', t:'polish new', w:'One UI for every provider plus local models' }]},

{ g:'ai', id:'a_img', q:'Generate images?', h:'Stable Diffusion and friends on your own GPU — ComfyUI, A1111', tag:'Generative Artificial Intelligence (GenAI)',
  alts:[{ i:'ComfyUI', l:'ComfyUI', t:'unix new', w:'Node graphs, maximum control' },
        { i:'Stable Diffusion web UI', l:'A1111 WebUI', t:'polish proven', w:'Classic form based UI, easier to start with' }]},

{ g:'ai', id:'a_rag', q:'Chat with your own documents and notes?', h:'Retrieval over your knowledge base, mail and PDFs — Khoj, Onyx', tag:'Generative Artificial Intelligence (GenAI)',
  alts:[{ i:'Khoj', l:'Khoj', w:'Second brain across notes, PDFs and the web' },
        { i:'Onyx Community Edition', l:'Onyx', w:'Company search across all your tools' },
        { i:'AnythingLLM', l:'AnythingLLM', w:'Workspaces built from your own documents' }]},

{ g:'ai', id:'a_auto', q:'Automate recurring workflows?', h:'When X happens, do Y — n8n, Node-RED, Activepieces, Huginn', tag:'Automation',
  aq:'Which style?', alts:[
  { i:'n8n', l:'n8n', t:'suite polish proven', w:'Visual workflow builder with 400+ integrations' },
  { i:'Activepieces', l:'Activepieces', t:'polish new', w:'Zapier feeling, very tidy' },
  { i:'Node RED', l:'Node-RED', t:'lean unix', w:'Wire up events, perfect next to Home Assistant' },
  { i:'Dify.ai', l:'Dify', t:'suite new', w:'Purpose built for AI workflows and agents' },
  { i:'Huginn', l:'Huginn', t:'lean proven', w:'Agents that watch the web for you' },
  { i:'changedetection.io', l:'changedetection.io', t:'unix lean', w:'Only watches web pages for changes' }]},

/* ============================ LIFE ============================ */
{ g:'life', id:'l_recipe', q:'Collect recipes and plan meals?', h:'Import by link, weekly plan, shopping list — Mealie, Tandoor', tag:'Recipe Management',
  alts:[{ i:'Mealie', l:'Mealie', t:'polish new', w:'Pretty, phone friendly, great import' },
        { i:'Tandoor Recipes', l:'Tandoor', t:'suite proven', w:'Very strong at planning and pantry' },
        { i:'Bar Assistant', l:'Bar Assistant', nx:1, t:'unix', w:'For cocktails' }]},

{ g:'life', id:'l_money', fx:1, q:'Get your finances under control?', h:'Budget, accounts, portfolio, subscriptions — Actual, Firefly III, Wallos', tag:'Money, Budgeting & Management',
  aq:'What is it about?', alts:[
  { i:'Actual', l:'Budgeting (Actual)', w:'Envelope budgeting, very fast' },
  { i:'Firefly III', l:'Bookkeeping (Firefly III)', w:'All accounts, rules and reports' },
  { i:'Ghostfolio', l:'Portfolio (Ghostfolio)', w:'Stocks and crypto at a glance' },
  { i:'Wallos', l:'Subscriptions (Wallos)', w:'Never miss a renewal again' },
  { i:'Maybe', l:'Net worth (Maybe)', w:'Accounts, investments and wealth in one' },
  { i:'Invoice Ninja', l:'Invoicing (Invoice Ninja)', w:'Quotes, invoices, reminders' }]},

{ g:'life', id:'l_inv', fx:1, q:'Keep an inventory of your stuff?', h:'From the cellar to the pantry to the parts bin — HomeBox, Grocy, InvenTree', tag:'Inventory Management',
  aq:'What are you storing?', alts:[
  { i:'HomeBox (SysAdminsMedia)', l:'Household (HomeBox)', w:'What is in which box, with QR labels' },
  { i:'grocy', l:'Groceries (Grocy)', w:'ERP for your fridge, with expiry dates' },
  { i:'Inventree', l:'Parts (InvenTree)', w:'Electronics stock with bills of materials' },
  { i:'Part-DB', l:'Parts (Part-DB)', w:'The classic for an electronics workshop' },
  { i:'Koillection', l:'Collections (Koillection)', w:'Any collection: records, stamps, LEGO, wine' }]},

{ g:'life', id:'l_fit', q:'Track training and health?', h:'Without handing data to a fitness corporation — wger, FitTrackee', tag:'Health and Fitness',
  alts:[{ i:'wger', l:'wger', t:'suite proven', w:'Workout plans, weight and nutrition' },
        { i:'FitTrackee', l:'FitTrackee', t:'lean', w:'Analyse GPX activities' },
        { i:'Endurain', l:'Endurain', t:'polish new', w:'Modern Strava replacement' }]},

{ g:'life', id:'l_travel', fx:1, q:'Record trips, tours or places?', h:'Where you have been and where you want to go — AdventureLog, wanderer, Dawarich', tag:'Maps and Global Positioning System (GPS)',
  aq:'What interests you?', alts:[
  { i:'AdventureLog', l:'Travel (AdventureLog)', w:'Visited places and trip planning' },
  { i:'wanderer', l:'Tours (wanderer)', w:'GPX collection for hiking and cycling' },
  { i:'Dawarich', l:'Location history (Dawarich)', w:'Google Timeline replacement' },
  { i:'OwnTracks Recorder', l:'Raw tracking (OwnTracks)', w:'Your own private location log' }]},

/* ============================ WEB / BUSINESS ============================ */
{ g:'web', id:'w_site', q:'Run a website or blog?', h:'From Markdown files to a full CMS — Ghost, WordPress, Hugo', tag:'Content Management Systems (CMS)',
  aq:'How do you want to maintain it?', alts:[
  { i:'Ghost', l:'Blog (Ghost)', t:'polish new', w:'Publishing and newsletters, very fast' },
  { i:'WordPress', l:'Classic (WordPress)', t:'suite proven', w:'A plugin for absolutely everything' },
  { i:'Hugo', l:'Static (Hugo)', t:'lean unix', w:'Markdown in, HTML out — extremely fast' },
  { i:'Strapi', l:'Headless (Strapi)', t:'unix new', w:'Content plus API for your own front end' },
  { i:'Payload CMS', l:'Headless (Payload)', t:'polish new', w:'Modern, TypeScript first' }]},

{ g:'web', id:'w_shop', q:'Build an online shop?', h:'Products, cart, payments — Medusa, Saleor, PrestaShop', tag:'E-commerce',
  alts:[{ i:'MedusaJs', l:'Medusa', t:'unix new', w:'Headless, modern, developer friendly' },
        { i:'Saleor', l:'Saleor', t:'suite new', w:'GraphQL first, scales well' },
        { i:'PrestaShop', l:'PrestaShop', t:'suite proven', w:'Classic shop with a full back office' },
        { i:'Bagisto', l:'Bagisto', t:'suite', w:'Laravel based with many modules' }]},

{ g:'web', id:'w_analytics', q:'Count visitors without Google Analytics?', h:'Privacy friendly, usually without a cookie banner — Umami, Plausible, Matomo', tag:'Analytics',
  aq:'How deep?', alts:[
  { i:'Umami', l:'Umami', t:'lean new', w:'Lean, pretty, running in minutes' },
  { i:'Plausible Analytics', l:'Plausible', t:'lean polish', w:'Clear and data frugal' },
  { i:'Matomo', l:'Matomo', t:'suite proven', w:'The full Google Analytics feature set' },
  { i:'PostHog', l:'PostHog', t:'suite polish new', w:'Product analytics with session replay' }]},

{ g:'web', id:'w_forms', fx:1, q:'Collect forms, surveys or meeting times?', h:'A Google Forms or Doodle replacement — Formbricks, OpnForm, Rallly', tag:'Polls and Events',
  aq:'What for?', alts:[
  { i:'Formbricks', l:'Surveys (Formbricks)', w:'Modern, with proper analysis' },
  { i:'OpnForm', l:'Forms (OpnForm)', w:'Quick to build and good looking' },
  { i:'Rallly', l:'Meeting times (Rallly)', w:'Doodle replacement, no account needed' },
  { i:'LimeSurvey', l:'Serious studies (LimeSurvey)', w:'Academic grade, very powerful' }]},

{ g:'web', id:'w_book', q:'Let people book appointments?', h:'A Calendly replacement — Cal.com', tag:'Booking and Scheduling',
  alts:[{ i:'Cal.diy', l:'Cal.com / Cal.diy', w:'The Calendly replacement' },
        { i:'Easy!Appointments', l:'Easy!Appointments', w:'Classic appointment booking' },
        { i:'Hi.Events', l:'Hi.Events', w:'Events with ticket sales' }]},

{ g:'web', id:'w_support', q:'Handle support requests as tickets?', h:'A shared inbox with history — Zammad, FreeScout', tag:'Ticketing',
  alts:[{ i:'Zammad', l:'Zammad', t:'suite proven', w:'Mature, many channels' },
        { i:'FreeScout', l:'FreeScout', t:'lean proven', w:'Help Scout replacement, frugal' },
        { i:'Libredesk', l:'Libredesk', t:'lean new', w:'Lean and modern' }]},

{ g:'web', id:'w_pm', q:'Plan projects with a team (Jira replacement)?', h:'Sprints, roadmaps, time tracking — Plane, OpenProject', tag:'Software Development - Project Management',
  alts:[{ i:'Plane', l:'Plane', t:'polish new', w:'Modern Jira and Linear feeling' },
        { i:'OpenProject', l:'OpenProject', t:'suite proven', w:'Classic, with gantt and budgets' },
        { i:'Leantime', l:'Leantime', t:'polish', w:'For small teams and non technical people' },
        { i:'Huly', l:'Huly', t:'suite new', w:'Projects, chat and HR in one' }]},

{ g:'web', id:'w_crm', q:'Manage customers and contacts (CRM)?', h:'Pipeline, notes, follow ups — Twenty, EspoCRM', tag:'Customer Relationship Management (CRM)',
  alts:[{ i:'Twenty', l:'Twenty', t:'polish new', w:'Modern CRM, very good looking' },
        { i:'EspoCRM', l:'EspoCRM', t:'lean proven', w:'Frugal and flexible' },
        { i:'SuiteCRM', l:'SuiteCRM', t:'suite proven', w:'Enterprise feature set' }]},

{ g:'web', id:'w_erp', q:'Run a whole business (ERP)?', h:'Accounting, stock, staff, sales — Odoo, ERPNext', tag:'Resource Planning',
  alts:[{ i:'Odoo', l:'Odoo', t:'suite polish', w:'Enormous module ecosystem' },
        { i:'ERPNext', l:'ERPNext', t:'suite proven', w:'Fully open and very complete' },
        { i:'Dolibarr', l:'Dolibarr', t:'lean proven', w:'Lean entry point for small business' }]},

{ g:'web', id:'w_url', q:'Run short links or a link-in-bio page?', h:'With click statistics — Shlink, Kutt', tag:'URL Shorteners',
  alts:[{ i:'Shlink', l:'Shlink', t:'lean proven', w:'API first, with a web client and QR codes' },
        { i:'Kutt', l:'Kutt', t:'polish', w:'Pretty, simple, with statistics' },
        { i:'LinkStack', l:'LinkStack', t:'polish', w:'Linktree replacement' }]},

/* ============================ LEARNING / CULTURE ============================ */
{ g:'learn', id:'e_offline', q:'Keep an offline copy of the internet?', h:'Wikipedia, Stack Overflow and Gutenberg without a connection — Kiwix', tag:'Archiving and Digital Preservation (DP)',
  alts:[{ i:'Kiwix', l:'Kiwix', w:'The whole of Wikipedia from one file — great for a cabin or a boat' },
        { i:'ArchiveBox', l:'ArchiveBox', w:'Archives every page you feed it, forever' },
        { i:'Wallabag', l:'Wallabag', w:'Keeps readable copies of articles' }]},

{ g:'learn', id:'e_lms', q:'Teach courses or train people?', h:'A learning platform with lessons and quizzes — Moodle, Canvas LMS', tag:'Learning and Courses',
  alts:[{ i:'Moodle', l:'Moodle', t:'suite proven', w:'The most widespread learning platform in the world' },
        { i:'Canvas LMS', l:'Canvas LMS', t:'polish', w:'Modern, used by many universities' },
        { i:'Chamilo LMS', l:'Chamilo', t:'lean', w:'Easier to run, quick to set up' }]},

{ g:'learn', id:'e_lib', q:'Run a real library catalogue?', h:'For a club, school or a very large private collection — Koha', tag:'Document Management - Integrated Library Systems (ILS)',
  alts:[{ i:'Koha', l:'Koha', t:'suite proven', w:'Full library system, used by real libraries' },
        { i:'Evergreen', l:'Evergreen', t:'suite proven', w:'Built for library networks' },
        { i:'Calibre Web Automated', l:'Calibre-Web', nx:1, t:'lean', w:'Enough for a large private collection' }]},

{ g:'learn', id:'e_family', q:'Research family history?', h:'A family tree with sources and media — webtrees, Gramps Web', tag:'Genealogy',
  alts:[{ i:'webtrees', l:'webtrees', w:'The web based standard, GEDCOM compatible' },
        { i:'Gramps Web', l:'Gramps Web', w:'Web front end for the Gramps desktop app' }]},

{ g:'learn', id:'e_conf', q:'Organise a conference or club meeting?', h:'Call for papers, schedule, agenda — pretalx, indico, OpenSlides', tag:'Conference Management',
  alts:[{ i:'pretalx', l:'pretalx', w:'Submissions and schedule, used by many community conferences' },
        { i:'indico', l:'Indico', w:'CERN grade event management' },
        { i:'OpenSlides', l:'OpenSlides', w:'Motions and voting for assemblies' }]},

/* ============================ OPERATIONS ============================ */
{ g:'ops', id:'o_docker', q:'Manage containers through an interface?', h:'Logs, restarts, updates, compose stacks — Portainer, Dockge, Komodo', tag:'SysAdmin - Software Containers',
  aq:'What is your style?', alts:[
  { i:'Portainer Community Edition', l:'Portainer', t:'suite polish proven', w:'The classic: sees and does everything' },
  { i:'Dockge', l:'Dockge', t:'lean new', w:'Compose stacks only, and wonderfully simple' },
  { i:'Komodo', l:'Komodo', t:'suite new', w:'Several servers plus builds straight from Git' },
  { i:'Dozzle', l:'Dozzle', nx:1, t:'lean unix', w:'Just the logs, live and searchable' },
  { i:'Cockpit', l:'Cockpit', t:'suite proven', w:'The whole server in the browser, not only Docker' }]},

{ g:'ops', id:'o_update', fx:1, q:'Stay on top of container updates?', h:'Update automatically or just get told — Watchtower, WUD, Diun', tag:'SysAdmin - Software Containers',
  aq:'Automatic or informed?', alts:[
  { i:"What's up Docker", l:'Notify me', w:'WUD reports new image versions and lets you decide' },
  { i:'Diun', l:'Notify me (Diun)', w:'Watches registries and messages you' },
  { i:'Watchtower', l:'Update automatically', w:'Watchtower pulls new images by itself' }]},

{ g:'ops', id:'o_virt', q:'Run virtual machines?', h:'Several systems on one box, with snapshots — Proxmox VE, XCP-ng', tag:'SysAdmin - Virtualization',
  alts:[{ i:'Proxmox VE', l:'Proxmox VE', t:'suite polish proven', w:'The self hosting standard: VMs, LXC and clustering' },
        { i:'XCP-ng', l:'XCP-ng', t:'proven', w:'Xen based, rock solid in operation' },
        { i:'OpenNebula', l:'OpenNebula', t:'suite', w:'Private cloud across many hosts' }]},

{ g:'ops', id:'o_k8s', q:'Go the Kubernetes route?', h:'Only if you actually want it — k3s, Rancher, Argo CD', tag:'SysAdmin - Software Containers',
  alts:[{ i:'k3s', l:'k3s', w:'Certified Kubernetes in a single binary' },
        { i:'Rancher', l:'Rancher', w:'Manage clusters through a friendly UI' },
        { i:'Portainer Community Edition', l:'Portainer', w:'Also speaks Kubernetes, gentler learning curve' }]},

{ g:'ops', id:'o_iac', q:'Describe your infrastructure as code?', h:'Reproducible instead of hand crafted — Ansible, Semaphore UI, OpenTofu', tag:'SysAdmin - Configuration Management',
  alts:[{ i:'Semaphore UI', l:'Semaphore UI', t:'polish new', w:'Web UI and scheduler for Ansible and Terraform' },
        { i:'Ansible', l:'Ansible', t:'unix proven', w:'Agentless configuration management' },
        { i:'OpenTofu', l:'OpenTofu', t:'unix new', w:'The open Terraform fork' },
        { i:'Salt', l:'Salt', t:'suite proven', w:'Fast at scale, event driven' }]},

{ g:'ops', id:'o_logs', q:'Collect and search logs centrally?', h:'When journalctl is no longer enough — Loki, GoAccess', tag:'SysAdmin - Log Management',
  alts:[{ i:'Loki', l:'Grafana Loki', t:'suite new', w:'Logs the Prometheus way, cheap to run' },
        { i:'GoAccess', l:'GoAccess', t:'lean proven', w:'Web server logs analysed in real time' },
        { i:'Fluentd', l:'Fluentd', nx:1, t:'unix proven', w:'Collects and routes everything' }]},

{ g:'ops', id:'o_status', q:'Publish a status page for other people?', h:'So the household or your users can check for themselves — Kener, cState', tag:'SysAdmin - Monitoring & Status Pages',
  alts:[{ i:'Kener', l:'Kener', t:'polish new', w:'Good looking status page with incidents' },
        { i:'cState', l:'cState', t:'lean', w:'Static and extremely light' },
        { i:'OneUptime', l:'OneUptime', t:'suite', w:'Full package including on-call' }]},

{ g:'ops', id:'o_disk', q:'Watch disk health before a drive dies?', h:'SMART values with a graph and an alert — Scrutiny', tag:'SysAdmin - Monitoring & Status Pages',
  alts:[{ i:'Scrutiny', l:'Scrutiny', t:'unix new', w:'SMART monitoring with a proper web UI' },
        { i:'Netdata', l:'Netdata', t:'suite proven', w:'Also covers disks, plus everything else' }]},
];

/* Added automatically when the resulting stack calls for them.
   `need` links to a question - if you answered that yourself, the must-have is skipped. */
const MUSTS = [
  { i:'Portainer Community Edition', need:'o_docker', c:x=>x.docker && x.dockerCount>=3,
    why:'You are getting several Docker containers. A management UI saves you a terminal session every day.' },
  { i:'Nginx Proxy Manager', need:'n_proxy', c:x=>x.webCount>=3,
    why:'Several web services without a reverse proxy means port chaos and no HTTPS. This gives every service a real address with a certificate.' },
  { i:'Backrest', need:'f_backup', c:x=>x.total>=4,
    why:'Without a backup all of this is only borrowed. Restic with a web UI is the fastest route to verified, encrypted snapshots.' },
  { i:'Uptime Kuma', need:'n_monitor', c:x=>x.total>=5,
    why:'Once several services run you want to notice an outage before your users do.' },
  { i:'Homepage by gethomepage', need:'n_dash', c:x=>x.total>=6,
    why:'Past roughly six services nobody remembers ports and URLs. A dashboard becomes the front door to your server.' },
  { i:'Vaultwarden', need:'p_pw', c:x=>x.total>=6,
    why:'Every new service means new credentials. Vaultwarden is tiny and works with all the Bitwarden apps.' },
  { i:'WireGuard', need:'n_vpn', c:x=>x.total>=4 && x.exposure!=='public',
    why:'The safest way to reach your things from outside: a VPN instead of open ports.' },
  { i:'Authelia', need:'n_sso', c:x=>x.exposure==='public',
    why:'You want services reachable from the internet. Put an authentication layer with 2FA in front of them.' },
  { i:'CrowdSec', need:'n_sec', c:x=>x.exposure==='public',
    why:'Anything public is scanned within hours. CrowdSec blocks attackers automatically.' },
  { i:"What's up Docker", need:'o_update', c:x=>x.docker && x.dockerCount>=5,
    why:'Unpatched containers are the most common way in. At the very least, get told when updates exist.' },
  { i:'Gluetun VPN client', need:null, c:x=>x.has('m_torrent'),
    why:'Torrent traffic belongs inside a VPN tunnel. Gluetun wraps your download client at the container level.' },
  { i:'Prowlarr', need:null, c:x=>x.has('m_arr'),
    why:'Without a central indexer manager you maintain your sources separately in every *arr app.' },
  { i:'ntfy', need:'c_notify', c:x=>x.total>=7,
    why:'Backups, outages, new downloads: with ntfy your services can reach your phone in one line of shell.' },
  { i:'Scrutiny', need:'o_disk', c:x=>x.has('f_nas') || x.has('f_backup'),
    why:'You are storing real data. Watch the SMART values so you replace a disk before it takes the data with it.' },
];
