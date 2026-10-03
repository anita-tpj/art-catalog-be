import {
  AdminRole,
  ArtworkAvailability,
  ArtworkCategory,
  ArtworkMotive,
  ArtworkOrientation,
  ArtworkStyle,
  ArtworkTechnique,
  ItemStatus,
  ItemVisibility,
  PrismaClient,
} from "@prisma/client";

import bcrypt from "bcrypt";

const prisma = new PrismaClient();

function optionalEnv(name: string, fallback: string) {
  return process.env[name] ?? fallback;
}

async function main() {
  console.log("🌱 Ensuring admin user...");

  const adminEmail = optionalEnv("ADMIN_EMAIL", "admin@artcatalog.local");
  const adminPassword = optionalEnv("ADMIN_PASSWORD", "admin12345");
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      role: AdminRole.ADMIN,
      isActive: true,
    },
    create: {
      email: adminEmail,
      passwordHash,
      role: AdminRole.ADMIN,
      isActive: true,
    },
  });

  console.log(`✅ Admin ensured: ${adminEmail}`);

  const artistsCount = await prisma.artist.count();

  if (artistsCount > 0) {
    console.log("🌱 Seed skipped (DB already has artists).");
    return;
  }

  console.log("🌱 Seeding current ArtCatalog demo content...");

  const artist1 = await prisma.artist.create({
    data: {
      name: "Ana Petrović",
      bio: "Ana Petrović (1988) je srpska fotografkinja čiji je rad usmeren na svakodnevni život, ljudsko prisustvo i male priče skrivene u običnim mestima. Najčešće radi sa prirodnim svetlom, beležeći ulice, enterijere i prolazne trenutke koji lako ostaju neprimećeni.\n\nNjen rad se kreće između dokumentarne i umetničke fotografije, sa posebnim interesovanjem za atmosferu, gest i odnos ljudi prema prostoru koji ih okružuje. Umesto insceniranih prizora, Ana traži spontane kompozicije u kojima svetlost, boja i naizgled nevažni detalji otkrivaju karakter određenog mesta ili trenutka.\n\nNjene fotografije često imaju miran i posmatrački karakter, istražujući teme sećanja, samoće i svakodnevnog života u savremenom urbanom okruženju.",
      country: "Serbia",
      birthYear: 1988,
      avatarUrl:
        "https://res.cloudinary.com/ddoathau6/image/upload/v1766146153/artcatalog-seed/artists/ana-petrovic.avif",
      avatarPublicId: "artcatalog-seed/artists/ana-petrovic",
      primaryCategory: ArtworkCategory.PHOTOGRAPHY,
      status: ItemStatus.PUBLISHED,
      visibility: ItemVisibility.PUBLIC,
      slug: "ana-petrovic",
      slugLocked: true,
    },
  });

  await prisma.artwork.create({
    data: {
      title: "Posle kiše",
      year: 2025,
      description:
        "„Posle kiše“ beleži gradski trenutak na prelazu između dana i večeri, kada se svetlost iz izloga, uličnih lampi i saobraćaja prelama preko mokrog asfalta. Figura sa kišobranom postaje tiho središte kompozicije, dok se grad nastavlja kretati oko nje.\n\nKroz kontrast hladnog neba i toplih gradskih svetala, Ana Petrović pretvara svakodnevni prizor u atmosferičnu sliku prolaznosti i urbanog života. Refleksije na ulici dodatno brišu granicu između stvarnog prostora i njegovog odraza.\nDigitalna fotografija, 4000 × 4000 px.",
      imageUrl:
        "https://res.cloudinary.com/ddoathau6/image/upload/v1791023182/artcatalog/artworks/uyaywjcg3ordbcjguxiz.png",
      imagePublicId: "artcatalog/artworks/uyaywjcg3ordbcjguxiz",
      technique: ArtworkTechnique.OTHER,
      style: ArtworkStyle.CONTEMPORARY,
      motive: ArtworkMotive.CITYSCAPE,
      orientation: ArtworkOrientation.SQUARE,
      framed: false,
      artistId: artist1.id,
      category: ArtworkCategory.PHOTOGRAPHY,
      status: ItemStatus.PUBLISHED,
      availability: ArtworkAvailability.AVAILABLE,
    },
  });

  await prisma.artwork.create({
    data: {
      title: "Između dana i večeri",
      year: 2024,
      description:
        "„Između dana i večeri“ beleži tih trenutak u gradskom kafeu dok poslednja dnevna svetlost ulazi kroz veliki prozor. Usamljena figura okrenuta prema gradu ostaje bez jasnog identiteta, postajući deo prostora i atmosfere umesto klasičnog portreta.\n\nTopla svetlost zalaska povezuje enterijer sa gradom u pozadini, dok odrazi na staklu i detalji svakodnevnog života stvaraju više vizuelnih slojeva. Fotografija istražuje kratke trenutke mirovanja unutar grada koji se neprestano menja.",
      imageUrl:
        "https://res.cloudinary.com/ddoathau6/image/upload/v1791023366/artcatalog/artworks/y3b5d8bnlxqizdl1arbh.png",
      imagePublicId: "artcatalog/artworks/y3b5d8bnlxqizdl1arbh",
      technique: ArtworkTechnique.OTHER,
      style: ArtworkStyle.CONTEMPORARY,
      motive: ArtworkMotive.FIGURE,
      orientation: ArtworkOrientation.SQUARE,
      framed: false,
      artistId: artist1.id,
      category: ArtworkCategory.PHOTOGRAPHY,
      status: ItemStatus.PUBLISHED,
      availability: ArtworkAvailability.NOT_FOR_SALE,
    },
  });

  await prisma.artwork.create({
    data: {
      title: "Polazak",
      year: 2026,
      description:
        "„Polazak“ beleži trenutak na železničkoj stanici neposredno pred putovanje, dok se putnici kreću između perona i voza obasjanog poslednjim dnevnim svetlom. Figura u prvom planu zaustavljena je usred tog kretanja, stvarajući kontrast između mirovanja i užurbanosti prostora oko nje.\n\nTopla svetlost zalaska, dugačke senke i odrazi na površinama pretvaraju svakodnevni prizor u atmosferičnu sliku iščekivanja. Fotografija istražuje kratku granicu između ostajanja i odlaska — trenutak kada jedno mesto postaje prošlost, a drugo još nije stiglo.",
      imageUrl:
        "https://res.cloudinary.com/ddoathau6/image/upload/v1791023477/artcatalog/artworks/xjwlg0dznc3gnqgme7ra.png",
      imagePublicId: "artcatalog/artworks/xjwlg0dznc3gnqgme7ra",
      style: ArtworkStyle.CONTEMPORARY,
      motive: ArtworkMotive.FIGURE,
      orientation: ArtworkOrientation.SQUARE,
      framed: false,
      artistId: artist1.id,
      category: ArtworkCategory.PHOTOGRAPHY,
      status: ItemStatus.DRAFT,
      availability: ArtworkAvailability.AVAILABLE,
    },
  });

  const artist2 = await prisma.artist.create({
    data: {
      name: "Sofija Kovač",
      bio: "Sofija Kovač (1995) je srpska umetnica i ilustratorka čiji se rad zasniva na crtežu, liniji i pažljivom posmatranju svakodnevnog života. Najčešće radi olovkom i tušem na papiru, povremeno kombinujući crtež sa akvarelom i drugim tradicionalnim tehnikama.\n\nU njenim radovima pojavljuju se ljudske figure, biljke, enterijeri i mali prizori iz svakodnevice. Posebno je interesuje odnos između figure i prostora, kao i način na koji jednostavan gest, predmet ili detalj može da sugeriše širu priču.\n\nNjen stil karakterišu izražajna linija, svedena paleta i kombinovanje precizno iscrtanih detalja sa nedovršenim delovima kompozicije. Crtež koristi kao način beleženja trenutaka, ali i kao prostor u kojem se stvarna zapažanja postepeno pretvaraju u lične i imaginarne prizore.",
      country: "Serbia",
      birthYear: 1995,
      avatarUrl:
        "https://res.cloudinary.com/ddoathau6/image/upload/v1766146155/artcatalog-seed/artists/sofia-muller.avif",
      avatarPublicId: "artcatalog-seed/artists/sofia-muller",
      primaryCategory: ArtworkCategory.DRAWING_ILLUSTRATION,
      status: ItemStatus.PUBLISHED,
      visibility: ItemVisibility.PUBLIC,
      slug: "sofija-kovac",
      slugLocked: true,
    },
  });

  await prisma.artwork.create({
    data: {
      title: "Ulica prema moru",
      year: 2025,
      description:
        "„Ulica prema moru“ prikazuje miran trenutak u uskoj mediteranskoj ulici koja se spušta prema obali. Kamene fasade, mali kafe i bujna vegetacija iscrtani su preciznim linijama, dok nežni akvarelni tonovi unose svetlost i atmosferu letnjeg dana.\n\nKombinujući detaljan crtež sa slobodnijim površinama boje, Sofija Kovač gradi prizor koji se nalazi između stvarnog mesta i sećanja na putovanje. More u daljini ostaje vizuelna tačka prema kojoj se čitava kompozicija postepeno otvara.",
      imageUrl:
        "https://res.cloudinary.com/ddoathau6/image/upload/v1791023795/artcatalog/artworks/otanqxa8dbjbviip7o2j.png",
      imagePublicId: "artcatalog/artworks/otanqxa8dbjbviip7o2j",
      technique: ArtworkTechnique.WATERCOLOR,
      style: ArtworkStyle.CONTEMPORARY,
      motive: ArtworkMotive.CITYSCAPE,
      orientation: ArtworkOrientation.SQUARE,
      framed: false,
      artistId: artist2.id,
      category: ArtworkCategory.DRAWING_ILLUSTRATION,
      status: ItemStatus.PUBLISHED,
      availability: ArtworkAvailability.RESERVED,
    },
  });

  await prisma.artwork.create({
    data: {
      title: "Pored prozora",
      year: 2024,
      description:
        "„Pored prozora“ prikazuje mladu ženu u tihom trenutku posmatranja grada. Okrenuta od posmatrača i oslonjena na ruku, figura ostaje bez jasne priče, dok otvorena sveska, olovka i šolja na stolu nagoveštavaju prekinutu svakodnevnu aktivnost.\n\nSofija Kovač koristi različitu gustinu linije i senčenja kako bi izdvojila figuru od svetlijeg gradskog pejzaža u pozadini. Detaljno obrađeni delovi smenjuju se sa gotovo nedovršenim površinama papira, dajući crtežu spontan i intiman karakter.",
      imageUrl:
        "https://res.cloudinary.com/ddoathau6/image/upload/v1791023901/artcatalog/artworks/itybpmw27gv8tngfx8ja.png",
      imagePublicId: "artcatalog/artworks/itybpmw27gv8tngfx8ja",
      technique: ArtworkTechnique.PENCIL,
      style: ArtworkStyle.FIGURATIVE,
      motive: ArtworkMotive.FIGURE,
      orientation: ArtworkOrientation.SQUARE,
      framed: false,
      artistId: artist2.id,
      category: ArtworkCategory.DRAWING_ILLUSTRATION,
      status: ItemStatus.PUBLISHED,
      availability: ArtworkAvailability.AVAILABLE,
    },
  });

  await prisma.artwork.create({
    data: {
      title: "Maslinova grana",
      year: 2026,
      description:
        "„Maslinova grana“ prikazuje jednostavnu mrtvu prirodu sastavljenu od grančica masline, staklene posude i nekoliko plodova raspoređenih na osunčanom stolu. Prirodna svetlost i senke postaju važan deo kompozicije, naglašavajući teksturu lišća, kamena i stakla.\n\nSofija Kovač kombinuje precizne linije tuša sa transparentnim akvarelnim površinama i namerno ostavljenim tragovima papira. Svedena paleta zemljanih i maslinastih tonova daje radu miran, mediteranski karakter i pretvara običan svakodnevni motiv u studiju svetlosti, teksture i forme.",
      imageUrl:
        "https://res.cloudinary.com/ddoathau6/image/upload/v1791023992/artcatalog/artworks/iewu2kps7nb7pc44jc8v.png",
      imagePublicId: "artcatalog/artworks/iewu2kps7nb7pc44jc8v",
      technique: ArtworkTechnique.WATERCOLOR,
      style: ArtworkStyle.CONTEMPORARY,
      motive: ArtworkMotive.STILL_LIFE,
      orientation: ArtworkOrientation.SQUARE,
      framed: false,
      artistId: artist2.id,
      category: ArtworkCategory.DRAWING_ILLUSTRATION,
      status: ItemStatus.PUBLISHED,
      availability: ArtworkAvailability.AVAILABLE,
    },
  });

  const artist3 = await prisma.artist.create({
    data: {
      name: "Mila Vukovic",
      bio: "Mila Vuković je savremena umetnica iz Srbije čiji se rad razvija kroz apstraktno slikarstvo i istraživanje odnosa boje, teksture i pokreta. U svom radu najčešće koristi akril i kombinovane tehnike na platnu, gradeći kompozicije kroz slojeve boje, spontane poteze i naglašene teksture.\n\nInspiraciju pronalazi u svakodnevnim prizorima, promenama svetlosti i atmosferi prostora, koje transformiše u apstraktne vizuelne zapise. Njeni radovi balansiraju između spontanosti i pažljivo građenih kompozicija, ostavljajući prostor posmatraču za ličnu interpretaciju.",
      country: "Serbia",
      birthYear: 1979,
      avatarUrl:
        "https://res.cloudinary.com/ddoathau6/image/upload/v1791017587/artcatalog/artists/usz4xikxlu3g9ouzzjbs.png",
      avatarPublicId: "artcatalog/artists/usz4xikxlu3g9ouzzjbs",
      primaryCategory: ArtworkCategory.PAINTING,
      status: ItemStatus.PUBLISHED,
      visibility: ItemVisibility.PUBLIC,
      slug: "mila-vukovic",
      slugLocked: true,
    },
  });

  await prisma.artwork.create({
    data: {
      title: "Tragovi tišine",
      year: 2025,
      description:
        "„Tragovi tišine“ istražuje odnos između spontanog pokreta i mirnih, gotovo praznih površina. Slojevi prigušenih zemljanih, plavih i tamnih tonova prepliću se sa naglašenim potezima i teksturama, stvarajući osećaj fragmenata sećanja koji se pojavljuju i nestaju. Kompozicija ostavlja prostor za ličnu interpretaciju i različita emocionalna čitanja dela.",
      imageUrl:
        "https://res.cloudinary.com/ddoathau6/image/upload/v1791018034/artcatalog/artworks/ny0geoerogp5ydwclqeu.png",
      imagePublicId: "artcatalog/artworks/ny0geoerogp5ydwclqeu",
      technique: ArtworkTechnique.MIXED_MEDIA,
      style: ArtworkStyle.ABSTRACT,
      motive: ArtworkMotive.OTHER,
      orientation: ArtworkOrientation.PORTRAIT,
      size: "60 × 80 cm",
      framed: false,
      artistId: artist3.id,
      category: ArtworkCategory.PAINTING,
      status: ItemStatus.PUBLISHED,
      availability: ArtworkAvailability.AVAILABLE,
    },
  });

  await prisma.artwork.create({
    data: {
      title: "Između obala",
      year: 2026,
      description:
        "„Između obala“ gradi apstraktni pejzaž kroz susret toplih i hladnih tonova. Tamna horizontalna linija deli kompoziciju i stvara asocijaciju na udaljeni horizont i njegov odraz u vodi. Slojevite teksture, tragovi boje i nepravilne površine daju delu osećaj kretanja, dok kontrast dve strane kompozicije sugeriše prelazak između različitih prostora i raspoloženja.",
      imageUrl:
        "https://res.cloudinary.com/ddoathau6/image/upload/v1791018354/artcatalog/artworks/wl1ibnqk1kmpzjwig0et.png",
      imagePublicId: "artcatalog/artworks/wl1ibnqk1kmpzjwig0et",
      technique: ArtworkTechnique.ACRYLIC,
      style: ArtworkStyle.ABSTRACT,
      motive: ArtworkMotive.LANDSCAPE,
      orientation: ArtworkOrientation.LANDSCAPE,
      size: "70 × 100 cm",
      framed: false,
      artistId: artist3.id,
      category: ArtworkCategory.PAINTING,
      status: ItemStatus.PUBLISHED,
      availability: ArtworkAvailability.AVAILABLE,
    },
  });

  await prisma.artwork.create({
    data: {
      title: "Vrednost",
      year: 2025,
      description:
        "„Granice prostora“ istražuje odnos svetlih i tamnih površina kroz slojevitu, gotovo arhitektonsku kompoziciju. Duboki plavo-zeleni i crni tonovi grade centralnu masu dela, dok svetlije površine i topli oker detalji stvaraju kontrast i osećaj prolaza između različitih prostora. Ogrebotine, tanke linije i tragovi slojeva naglašavaju proces nastanka slike i daju kompoziciji osećaj dubine i kretanja.",
      imageUrl:
        "https://res.cloudinary.com/ddoathau6/image/upload/v1791018473/artcatalog/artworks/hajdedsduarr3xrrayb9.png",
      imagePublicId: "artcatalog/artworks/hajdedsduarr3xrrayb9",
      technique: ArtworkTechnique.MIXED_MEDIA,
      style: ArtworkStyle.ABSTRACT,
      motive: ArtworkMotive.OTHER,
      orientation: ArtworkOrientation.LANDSCAPE,
      size: "60 × 80 cm",
      framed: false,
      artistId: artist3.id,
      category: ArtworkCategory.PAINTING,
      status: ItemStatus.PUBLISHED,
      availability: ArtworkAvailability.AVAILABLE,
    },
  });

  const artist4 = await prisma.artist.create({
    data: {
      name: "Luka Radovic",
      bio: "Luka Radović (1981) je savremeni umetnik iz Srbije koji se prvenstveno bavi pejzažnim slikarstvom. Radi u ulju i akrilu na platnu, kombinujući elemente realizma sa slobodnijim, savremenim slikarskim izrazom.\n\nNjegov rad inspirisan je prirodom i pejzažima Balkana — planinskim predelima, rekama, jezerima i ruralnim prostorima. Posebnu pažnju posvećuje promenama svetlosti, atmosferi i odnosu boje i prostora, često pojednostavljujući stvarne prizore kako bi naglasio njihov karakter i raspoloženje.\n\nRadovi Luke Radovića odlikuju se mirnim kompozicijama, prirodnom paletom i izraženim osećajem prostora, dok pejzaž ostaje polazište za istraživanje ličnog doživljaja prirode.",
      country: "Serbia",
      birthYear: 1981,
      avatarUrl:
        "https://res.cloudinary.com/ddoathau6/image/upload/v1791018866/artcatalog/artists/fimzazjnkhkfbitgykei.png",
      avatarPublicId: "artcatalog/artists/fimzazjnkhkfbitgykei",
      primaryCategory: ArtworkCategory.PAINTING,
      status: ItemStatus.PUBLISHED,
      visibility: ItemVisibility.PUBLIC,
      slug: "luka-radovic",
      slugLocked: true,
    },
  });

  await prisma.artwork.create({
    data: {
      title: "Dolina svetlosti",
      year: 2025,
      description:
        "„Dolina svetlosti“ prikazuje prostrani planinski pejzaž u trenutku kada poslednji zraci sunca prelaze preko doline i površine vode. Topli tonovi osvetljenih stena i vegetacije suprotstavljeni su hladnijim plavim nijansama udaljenih planina, stvarajući osećaj dubine i tišine. Slobodniji potezi četkice daju prizoru savremeni karakter, dok prepoznatljivi elementi prirode ostaju centralni motiv dela.",
      imageUrl:
        "https://res.cloudinary.com/ddoathau6/image/upload/v1791019109/artcatalog/artworks/keyj9y4tlpod7n6dgog5.png",
      imagePublicId: "artcatalog/artworks/keyj9y4tlpod7n6dgog5",
      technique: ArtworkTechnique.OIL,
      style: ArtworkStyle.CONTEMPORARY,
      motive: ArtworkMotive.LANDSCAPE,
      orientation: ArtworkOrientation.LANDSCAPE,
      size: "70 × 100 cm",
      framed: false,
      artistId: artist4.id,
      category: ArtworkCategory.PAINTING,
      status: ItemStatus.PUBLISHED,
      availability: ArtworkAvailability.SOLD,
    },
  });

  await prisma.artwork.create({
    data: {
      title: "Poslednje svetlo",
      year: 2024,
      description:
        "„Poslednje svetlo“ beleži trenutak zalaska sunca nad mirnom rekom, kada se topli tonovi neba prelivaju preko površine vode. Kontrast između osvetljenog horizonta i tamnijih obrisa obale i planina naglašava prolaznost trenutka. Vidljivi potezi četkice i slojevita tekstura daju pejzažu živost, dok refleksija svetlosti postaje centralni element kompozicije.",
      imageUrl:
        "https://res.cloudinary.com/ddoathau6/image/upload/v1791019187/artcatalog/artworks/x92bdkptpgrcszbc4vtn.png",
      imagePublicId: "artcatalog/artworks/x92bdkptpgrcszbc4vtn",
      technique: ArtworkTechnique.OIL,
      style: ArtworkStyle.IMPRESSIONISM,
      motive: ArtworkMotive.LANDSCAPE,
      orientation: ArtworkOrientation.LANDSCAPE,
      size: "60 × 80 cm",
      framed: false,
      artistId: artist4.id,
      category: ArtworkCategory.PAINTING,
      status: ItemStatus.PUBLISHED,
      availability: ArtworkAvailability.AVAILABLE,
    },
  });

  await prisma.artwork.create({
    data: {
      title: "Kuće iznad jezera",
      year: 2023,
      description:
        "„Kuće iznad jezera“ prikazuje miran ruralni pejzaž u kojem se kamene kuće i staza stapaju sa okolnom vegetacijom, jezerom i planinama u daljini. Topla svetlost i zemljani tonovi prvog plana prelaze u hladnije nijanse vode i udaljenih planinskih obronaka, naglašavajući dubinu prostora. Slobodni potezi i naglašena tekstura daju prizoru osećaj neposrednosti i topline letnjeg dana.",
      imageUrl:
        "https://res.cloudinary.com/ddoathau6/image/upload/v1791019289/artcatalog/artworks/s9gz3slwrq5edxwdmo5l.png",
      imagePublicId: "artcatalog/artworks/s9gz3slwrq5edxwdmo5l",
      style: ArtworkStyle.IMPRESSIONISM,
      motive: ArtworkMotive.LANDSCAPE,
      orientation: ArtworkOrientation.LANDSCAPE,
      size: "70 × 100 cm",
      framed: false,
      artistId: artist4.id,
      category: ArtworkCategory.PAINTING,
      status: ItemStatus.PUBLISHED,
      availability: ArtworkAvailability.AVAILABLE,
    },
  });

  await prisma.artwork.create({
    data: {
      title: "Zimska tišina",
      year: 2025,
      description:
        "„Zimska tišina“ prikazuje planinsku dolinu prekrivenu snegom u poslednjim trenucima dnevne svetlosti. Hladni plavi i sivi tonovi pejzaža suprotstavljeni su toplim odsjajima zalaska sunca na površini reke, stvarajući mirnu i gotovo intimnu atmosferu. Tok vode vodi pogled kroz kompoziciju prema udaljenim planinama, dok izraženi potezi četkice i slojevita tekstura naglašavaju kontrast između hladnoće zimskog predela i topline svetlosti.",
      imageUrl:
        "https://res.cloudinary.com/ddoathau6/image/upload/v1791019406/artcatalog/artworks/zdelflrfromxtadtdf0n.png",
      imagePublicId: "artcatalog/artworks/zdelflrfromxtadtdf0n",
      technique: ArtworkTechnique.OIL,
      style: ArtworkStyle.IMPRESSIONISM,
      motive: ArtworkMotive.LANDSCAPE,
      orientation: ArtworkOrientation.LANDSCAPE,
      size: "60 × 80 cm",
      framed: false,
      artistId: artist4.id,
      category: ArtworkCategory.PAINTING,
      status: ItemStatus.PUBLISHED,
      availability: ArtworkAvailability.RESERVED,
    },
  });

  const artist5 = await prisma.artist.create({
    data: {
      name: "Clara Moreau",
      bio: "Clara Moreau (1990) je francuska savremena umetnica čiji je rad usmeren na figurativno slikarstvo i portret. Najčešće radi u ulju i akrilu na platnu, kombinujući prepoznatljive ljudske figure sa slobodnim potezima, naglašenom teksturom i svedenom paletom boja.\n\nU središtu njenog rada nalaze se intimni, svakodnevni trenuci i odnos između figure i prostora koji je okružuje. Posebnu pažnju posvećuje gestovima, pogledu i držanju tela, koristeći ih kao način da prenese raspoloženje bez potrebe za jasnim narativom.\n\nNjeni radovi kreću se između realizma i savremenog figurativnog izraza, često ostavljajući delove kompozicije nedovršenim ili svedenim kako bi pažnja ostala na prisustvu i emociji ljudske figure.",
      country: "France",
      birthYear: 1990,
      avatarUrl:
        "https://res.cloudinary.com/ddoathau6/image/upload/v1791020370/artcatalog/artists/atbs2xtfputlnzanhobm.png",
      avatarPublicId: "artcatalog/artists/atbs2xtfputlnzanhobm",
      primaryCategory: ArtworkCategory.PAINTING,
      status: ItemStatus.PUBLISHED,
      visibility: ItemVisibility.PUBLIC,
      slug: "clara-art",
      slugLocked: true,
    },
  });

  await prisma.artwork.create({
    data: {
      title: "Quiet Afternoon",
      year: 2025,
      description:
        "“Quiet Afternoon” captures a woman in a moment of stillness and introspection. Her distant gaze and relaxed posture suggest a pause between thought and everyday life. Layered, expressive brushstrokes and the contrast between warm skin tones and the cooler shades of the surrounding interior create a sense of intimacy while leaving the narrative deliberately open.",
      imageUrl:
        "https://res.cloudinary.com/ddoathau6/image/upload/v1791019843/artcatalog/artworks/g5vzpjelehwjsmjc75wz.png",
      imagePublicId: "artcatalog/artworks/g5vzpjelehwjsmjc75wz",
      style: ArtworkStyle.FIGURATIVE,
      motive: ArtworkMotive.FIGURE,
      orientation: ArtworkOrientation.SQUARE,
      framed: false,
      artistId: artist5.id,
      category: ArtworkCategory.PAINTING,
      status: ItemStatus.PUBLISHED,
      availability: ArtworkAvailability.AVAILABLE,
    },
  });

  await prisma.artwork.create({
    data: {
      title: "Before Evening",
      year: 2024,
      description:
        "“Before Evening” portrays a quiet moment of solitude as a woman sits turned away from the viewer, absorbed in her own thoughts. The restrained pose and downward gaze create a sense of intimacy, while the dark clothing contrasts with the warm skin tones and muted interior. Loose, textured brushwork allows the figure and surrounding space to merge at their edges, reinforcing the fleeting and private nature of the moment.",
      imageUrl:
        "https://res.cloudinary.com/ddoathau6/image/upload/v1791019881/artcatalog/artworks/hqvo4j9ie3elmdmf0tmv.png",
      imagePublicId: "artcatalog/artworks/hqvo4j9ie3elmdmf0tmv",
      technique: ArtworkTechnique.OIL,
      style: ArtworkStyle.FIGURATIVE,
      motive: ArtworkMotive.FIGURE,
      orientation: ArtworkOrientation.PORTRAIT,
      size: "60 × 80 cm",
      framed: false,
      artistId: artist5.id,
      category: ArtworkCategory.PAINTING,
      status: ItemStatus.DRAFT,
      availability: ArtworkAvailability.SOLD,
    },
  });

  await prisma.artwork.create({
    data: {
      title: "Sunday Morning",
      year: 2026,
      description:
        "“Sunday Morning” captures an unhurried domestic moment, placing the figure among familiar objects, flowers and morning light. The stillness of her pose contrasts with the lively textures and colors of the surrounding table, creating a balance between portraiture and still life. Warm yellows and soft skin tones are set against cooler blues and whites, giving the scene a sense of intimacy, comfort and quiet contemplation.",
      imageUrl:
        "https://res.cloudinary.com/ddoathau6/image/upload/v1791020023/artcatalog/artworks/pn1sg35ojikavthmeo1k.png",
      imagePublicId: "artcatalog/artworks/pn1sg35ojikavthmeo1k",
      technique: ArtworkTechnique.OIL,
      style: ArtworkStyle.FIGURATIVE,
      motive: ArtworkMotive.FIGURE,
      orientation: ArtworkOrientation.SQUARE,
      framed: false,
      artistId: artist5.id,
      category: ArtworkCategory.PAINTING,
      status: ItemStatus.PUBLISHED,
      availability: ArtworkAvailability.NOT_FOR_SALE,
    },
  });

  const artist6 = await prisma.artist.create({
    data: {
      name: "Jonas Keller",
      bio: "Jonas Keller (1985) is a German fine-art photographer whose work explores architecture, geometry and the relationship between light and urban space. His photographs focus on overlooked details of contemporary environments, transforming façades, stairways, windows and structural elements into carefully balanced compositions.\n\nWorking primarily with natural light, Keller uses strong lines, repetition, negative space and shadow to reduce familiar places to their essential visual forms. Human presence is often absent or only indirectly suggested, allowing architecture itself to become the central subject.\n\nHis work moves between architectural photography and abstraction, questioning where documentation ends and pure visual composition begins.",
      country: "Germany",
      birthYear: 1985,
      avatarUrl:
        "https://res.cloudinary.com/ddoathau6/image/upload/v1791020331/artcatalog/artists/uxsi7adrue3gfalimd8q.png",
      avatarPublicId: "artcatalog/artists/uxsi7adrue3gfalimd8q",
      primaryCategory: ArtworkCategory.PHOTOGRAPHY,
      status: ItemStatus.PUBLISHED,
      visibility: ItemVisibility.PUBLIC,
      slug: "jonas-keller",
      slugLocked: true,
    },
  });

  await prisma.artwork.create({
    data: {
      title: "Between Light and Concrete",
      year: 2025,
      description:
        "“Between Light and Concrete” explores the tension between rigid architectural forms and the changing character of natural light. Strong geometric lines divide the composition into areas of shadow, illuminated concrete and open landscape, while the distant sea introduces a sense of space beyond the structure. By removing human presence, Keller shifts attention toward proportion, surface and the subtle transformation of architecture throughout the day.",
      imageUrl:
        "https://res.cloudinary.com/ddoathau6/image/upload/v1791020437/artcatalog/artworks/njgc7f9v4hohbdp2bkfi.png",
      imagePublicId: "artcatalog/artworks/njgc7f9v4hohbdp2bkfi",
      technique: ArtworkTechnique.OTHER,
      style: ArtworkStyle.MINIMALISM,
      motive: ArtworkMotive.GEOMETRIC,
      orientation: ArtworkOrientation.LANDSCAPE,
      size: "70 × 100 cm",
      framed: false,
      artistId: artist6.id,
      category: ArtworkCategory.PHOTOGRAPHY,
      status: ItemStatus.PUBLISHED,
      availability: ArtworkAvailability.AVAILABLE,
    },
  });

  await prisma.artwork.create({
    data: {
      title: "Silent Geometry",
      year: 2024,
      description:
        "“Silent Geometry” reduces an architectural space to a composition of lines, surfaces, light and shadow. The rigid forms of concrete and steel are interrupted by the organic presence of a solitary tree, creating a subtle dialogue between the built and natural environment. Sharp areas of sunlight transform the otherwise functional space into an abstract arrangement of shapes, emphasizing Keller’s interest in geometry and negative space.",
      imageUrl:
        "https://res.cloudinary.com/ddoathau6/image/upload/v1791020590/artcatalog/artworks/exziwzdqx8e803yszh9p.png",
      imagePublicId: "artcatalog/artworks/exziwzdqx8e803yszh9p",
      technique: ArtworkTechnique.OTHER,
      style: ArtworkStyle.MINIMALISM,
      orientation: ArtworkOrientation.SQUARE,
      framed: false,
      artistId: artist6.id,
      category: ArtworkCategory.PHOTOGRAPHY,
      status: ItemStatus.PUBLISHED,
      availability: ArtworkAvailability.AVAILABLE,
    },
  });

  await prisma.artwork.create({
    data: {
      title: "Edge of Silence",
      year: 2026,
      description:
        "“Edge of Silence” examines the boundary between constructed space and the open landscape. Architectural planes frame the distant sea and mountains, while the reflecting pool creates a visual transition between solid surfaces and the natural horizon. Warm evening light softens the strict geometry of the structure, transforming a minimal architectural setting into a quiet study of space, reflection and distance.",
      imageUrl:
        "https://res.cloudinary.com/ddoathau6/image/upload/v1791020715/artcatalog/artworks/qrvgsj46eyqnvehgundh.png",
      imagePublicId: "artcatalog/artworks/qrvgsj46eyqnvehgundh",
      technique: ArtworkTechnique.OTHER,
      style: ArtworkStyle.MINIMALISM,
      motive: ArtworkMotive.GEOMETRIC,
      orientation: ArtworkOrientation.LANDSCAPE,
      size: "70 × 100 cm",
      framed: false,
      artistId: artist6.id,
      category: ArtworkCategory.PHOTOGRAPHY,
      status: ItemStatus.PUBLISHED,
      availability: ArtworkAvailability.AVAILABLE,
    },
  });

  await prisma.artwork.create({
    data: {
      title: "Light",
      year: 2025,
      description:
        "“Ascending Light” transforms a simple staircase into a study of movement, geometry and natural light. The ascending steps and curved concrete wall guide the eye toward the open sky, while sharp areas of sunlight contrast with deep architectural shadows. The presence of the tree beyond the structure introduces an organic element into the otherwise rigid composition, creating a quiet dialogue between architecture and nature.",
      imageUrl:
        "https://res.cloudinary.com/ddoathau6/image/upload/v1791020816/artcatalog/artworks/nfy2cvefdnyzpmpex9e9.png",
      imagePublicId: "artcatalog/artworks/nfy2cvefdnyzpmpex9e9",
      technique: ArtworkTechnique.OTHER,
      style: ArtworkStyle.MINIMALISM,
      orientation: ArtworkOrientation.PORTRAIT,
      size: "50 × 70 cm",
      framed: false,
      artistId: artist6.id,
      category: ArtworkCategory.PHOTOGRAPHY,
      status: ItemStatus.PUBLISHED,
      availability: ArtworkAvailability.RESERVED,
    },
  });

  const artist7 = await prisma.artist.create({
    data: {
      name: "Elena Rossi",
      bio: "Elena Rossi (1967) is an Italian sculptor whose work explores the human form through simplified silhouettes, organic volumes and tactile surfaces. Working primarily with stone, bronze and clay, she combines traditional sculptural techniques with a distinctly contemporary approach to form.\n\nThe human body remains a recurring presence in her work, although figures are often reduced to their essential gestures and proportions. Faces and anatomical details give way to curves, fragmented forms and the natural qualities of the material, allowing posture and balance to carry much of the emotional expression.\n\nInfluenced by classical Italian sculpture as well as modern abstraction, Rossi’s practice focuses on the relationship between body, material and surrounding space. Her works often retain visible traces of the sculpting process, emphasizing the physical act of shaping the material rather than concealing it.",
      country: "Italy",
      birthYear: 1967,
      avatarUrl:
        "https://res.cloudinary.com/ddoathau6/image/upload/v1791021292/artcatalog/artists/s1v7juzt1svijk6e8hfr.png",
      avatarPublicId: "artcatalog/artists/s1v7juzt1svijk6e8hfr",
      primaryCategory: ArtworkCategory.SCULPTURE,
      status: ItemStatus.PUBLISHED,
      visibility: ItemVisibility.PUBLIC,
      slug: "elena-rossi",
      slugLocked: true,
    },
  });

  await prisma.artwork.create({
    data: {
      title: "Silent Form",
      year: 2020,
      description:
        "“Silent Form” explores the relationship between solid material and empty space through two closely positioned organic volumes carved from pale stone. The narrow opening between the forms becomes as important as the material itself, changing in appearance as the work is viewed from different angles.\n\nRossi leaves parts of the surface visibly worked while polishing others to a softer finish, allowing traces of the sculpting process to remain present. The contrast between weight, curvature and negative space gives the work a quiet sense of tension and balance.\nSize: 70 × 38 × 30 cm",
      imageUrl:
        "https://res.cloudinary.com/ddoathau6/image/upload/v1791021612/artcatalog/artworks/aft7air4b9xkwhru6eme.png",
      imagePublicId: "artcatalog/artworks/aft7air4b9xkwhru6eme",
      technique: ArtworkTechnique.OTHER,
      style: ArtworkStyle.ABSTRACT,
      framed: false,
      artistId: artist7.id,
      category: ArtworkCategory.SCULPTURE,
      status: ItemStatus.PUBLISHED,
      availability: ArtworkAvailability.SOLD,
    },
  });

  await prisma.artwork.create({
    data: {
      title: "Continuum",
      year: 2025,
      description:
        "“Continuum” explores movement and balance through a continuous bronze form that appears to fold and turn around an open central space. Its curved surfaces shift between light and shadow as the viewer moves around the sculpture, giving the solid material an unexpected sense of fluidity.\n\nThe warm bronze patina and visible surface texture emphasize the physical character of the material, while the uninterrupted form suggests an ongoing cycle without a clear beginning or end.\nDimensions: 85 × 42 × 32 cm",
      imageUrl:
        "https://res.cloudinary.com/ddoathau6/image/upload/v1791021709/artcatalog/artworks/oks8kalgpxthotc2pzbh.png",
      imagePublicId: "artcatalog/artworks/oks8kalgpxthotc2pzbh",
      technique: ArtworkTechnique.OTHER,
      style: ArtworkStyle.ABSTRACT,
      framed: false,
      artistId: artist7.id,
      category: ArtworkCategory.SCULPTURE,
      status: ItemStatus.PUBLISHED,
      availability: ArtworkAvailability.AVAILABLE,
    },
  });

  const artist8 = await prisma.artist.create({
    data: {
      name: "Noah Bennett",
      bio: "Noah Bennett (1993) is a British digital artist whose work explores the relationship between geometry, colour and artificial light. Using digital painting and generative techniques, he creates abstract compositions in which layered forms, gradients and repeating structures appear to shift between two- and three-dimensional space.\n\nHis practice is influenced by architecture, graphic design and contemporary visual culture. Precise geometric structures are often combined with irregular textures and luminous colour transitions, creating a tension between order and unpredictability.\n\nBennett’s work investigates how digital tools can create images that feel both constructed and organic, using light, depth and repetition to transform simple forms into immersive visual environments.",
      country: "United Kingdom",
      birthYear: 1993,
      avatarUrl:
        "https://res.cloudinary.com/ddoathau6/image/upload/v1791021978/artcatalog/artists/f6zt46i5shbc3sol8tkb.png",
      avatarPublicId: "artcatalog/artists/f6zt46i5shbc3sol8tkb",
      primaryCategory: ArtworkCategory.DIGITAL_ART,
      status: ItemStatus.PUBLISHED,
      visibility: ItemVisibility.PUBLIC,
      slug: "noah-bennett",
      slugLocked: true,
    },
  });

  await prisma.artwork.create({
    data: {
      title: "Synthetic Sunset",
      year: 2026,
      description:
        "“Synthetic Sunset” constructs an imagined architectural landscape through geometry, artificial light and saturated colour. A monumental glowing form dominates the horizon while rigid structures and reflective water create a carefully ordered sense of depth.\n\nBy combining familiar elements of architecture and landscape with deliberately unreal proportions and colour, Bennett creates a space that feels simultaneously recognizable and impossible. The work explores the boundary between physical environments and places that can exist only within a digital image.\nDigital artwork, 4000 × 4000 px.",
      imageUrl:
        "https://res.cloudinary.com/ddoathau6/image/upload/v1791022122/artcatalog/artworks/jdccfjvpzrgfcv4nglp4.png",
      imagePublicId: "artcatalog/artworks/jdccfjvpzrgfcv4nglp4",
      technique: ArtworkTechnique.DIGITAL_PAINTING,
      style: ArtworkStyle.CONTEMPORARY,
      motive: ArtworkMotive.GEOMETRIC,
      orientation: ArtworkOrientation.SQUARE,
      framed: false,
      artistId: artist8.id,
      category: ArtworkCategory.DIGITAL_ART,
      status: ItemStatus.PUBLISHED,
      availability: ArtworkAvailability.NOT_FOR_SALE,
    },
  });

  await prisma.artwork.create({
    data: {
      title: "Chromatic Current",
      year: 2025,
      description:
        "“Chromatic Current” explores movement through layers of flowing colour and translucent digital forms. Luminous bands of blue, violet, orange and pink overlap across a dark field, creating shifting areas of depth and intensity.\n\nRather than representing a physical subject, the composition is built around rhythm, contrast and the illusion of continuous motion. Subtle textures interrupt the otherwise smooth gradients, giving the digital surface a more tactile quality and creating tension between precision and spontaneity.\n\nDigital artwork, 4000 × 4000 px.",
      imageUrl:
        "https://res.cloudinary.com/ddoathau6/image/upload/v1791022263/artcatalog/artworks/vibhphwlhsdqphhhkelu.png",
      imagePublicId: "artcatalog/artworks/vibhphwlhsdqphhhkelu",
      technique: ArtworkTechnique.DIGITAL_PAINTING,
      style: ArtworkStyle.ABSTRACT,
      motive: ArtworkMotive.OTHER,
      orientation: ArtworkOrientation.SQUARE,
      framed: false,
      artistId: artist8.id,
      category: ArtworkCategory.DIGITAL_ART,
      status: ItemStatus.PUBLISHED,
      availability: ArtworkAvailability.SOLD,
    },
  });

  await prisma.artwork.create({
    data: {
      title: "Threshold",
      year: 2024,
      description:
        "“Threshold” explores the relationship between geometry, light and reflection through a composition of monumental circular forms and a vertical field of warm illumination. Deep blue and charcoal shapes contrast with amber and ivory tones, creating a visual boundary between darkness and light.\n\nThe mirrored surface below extends the composition beyond its central horizon, giving the otherwise static geometry a sense of depth and movement. By combining precise digital forms with atmospheric textures, Bennett creates an imagined space that exists somewhere between architecture, landscape and abstraction.\n\nDigital artwork, 4000 × 4000 px.",
      imageUrl:
        "https://res.cloudinary.com/ddoathau6/image/upload/v1791022519/artcatalog/artworks/aymynjmiznoo70rus7ga.png",
      imagePublicId: "artcatalog/artworks/aymynjmiznoo70rus7ga",
      technique: ArtworkTechnique.DIGITAL_PAINTING,
      style: ArtworkStyle.ABSTRACT,
      motive: ArtworkMotive.GEOMETRIC,
      orientation: ArtworkOrientation.SQUARE,
      framed: false,
      artistId: artist8.id,
      category: ArtworkCategory.DIGITAL_ART,
      status: ItemStatus.PUBLISHED,
      availability: ArtworkAvailability.RESERVED,
    },
  });

  await prisma.artwork.create({
    data: {
      title: "Afterglow",
      year: null,
      description:
        "“Afterglow” reimagines a natural landscape through simplified forms, exaggerated scale and luminous digital colour. Layered mountain silhouettes surround a still body of water, while an oversized setting sun dominates the horizon and transforms the scene with intense shades of coral, violet and deep blue.\n\nRather than depicting a specific place, Bennett constructs an imagined landscape from familiar visual elements. Smooth gradients and carefully controlled reflections give the composition a calm, almost meditative quality while maintaining the distinctly artificial character of a digitally created environment.\n\nDigital artwork, 4000 × 4000 px.",
      imageUrl:
        "https://res.cloudinary.com/ddoathau6/image/upload/v1791022669/artcatalog/artworks/rkl3j81ye0ebdbedm8ak.png",
      imagePublicId: "artcatalog/artworks/rkl3j81ye0ebdbedm8ak",
      technique: ArtworkTechnique.DIGITAL_PAINTING,
      style: ArtworkStyle.CONTEMPORARY,
      motive: ArtworkMotive.GEOMETRIC,
      orientation: ArtworkOrientation.LANDSCAPE,
      framed: false,
      artistId: artist8.id,
      category: ArtworkCategory.DIGITAL_ART,
      status: ItemStatus.PUBLISHED,
      availability: ArtworkAvailability.AVAILABLE,
    },
  });

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
