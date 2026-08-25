import type { Doc } from './content';

/**
 * One page per platform, because the question people type is always
 * platform-shaped ("why does Instagram say my photo is AI") and a single
 * generic page cannot answer all of them well.
 */
export const PLATFORMS: Doc[] = [
  /* ------------------------------------------------------------ instagram */
  {
    slug: 'instagram',
    kind: 'platform',
    title: 'How to remove the “Made with AI” label on Instagram',
    metaTitle: 'Remove the Made with AI label on Instagram — free tool',
    description:
      'Instagram adds its AI label by reading C2PA and IPTC metadata inside your file, not by looking at the picture. Strip those fields in your browser before you post — free, no upload.',
    eyebrow: 'instagram',
    answer:
      'Instagram does not decide this by looking at your picture. It reads metadata fields inside the file — a C2PA content-credentials manifest, an IPTC digitalSourceType value, or an XMP tag naming the software. Remove those fields before you upload and the metadata trigger is gone. Nothing else about the image changes.',
    updated: '2026-08-24',
    blocks: [
      { t: 'h2', text: 'Why the label appears in the first place' },
      {
        t: 'p',
        text: 'Meta labels images using what it calls industry-standard AI indicators. In practice that means a small set of fields that generators and editors write into the file on export. If any of them say a generative tool was involved, the label is applied automatically — no human reviews it, and Instagram never has to analyse the picture itself.',
      },
      {
        t: 'ul',
        items: [
          'A C2PA manifest — a signed record of which tool made or edited the file, attached by Adobe Firefly, Photoshop, and a growing number of cameras and generators.',
          'IPTC digitalSourceType, a single field whose value can literally be trainedAlgorithmicMedia or compositeWithTrainedAlgorithmicMedia.',
          'XMP CreatorTool and edit history, which name the software — “Adobe Firefly” in that field is enough on its own.',
          'PNG text chunks, where Stable Diffusion interfaces store the full prompt, seed and model hash.',
        ],
      },
      {
        t: 'note',
        title: 'The label was renamed for a reason',
        text: 'Meta originally called it “Made with AI”. After photographers complained that lightly retouched real photographs were being tagged, it was renamed to the softer “AI info”. The rename was an admission that the metadata trigger catches far more than fully generated images.',
      },

      { t: 'h2', text: 'Remove the metadata before you post' },
      {
        t: 'steps',
        items: [
          {
            title: 'Export your image as usual',
            text: 'Finish your edit in whatever tool you use. The metadata is written at export, so clean the file you are actually going to upload — not an earlier version.',
          },
          {
            title: 'Drop it into the scanner below',
            text: 'It runs in this tab. The file is read from your disk into browser memory and never sent anywhere, so nothing is uploaded and nothing is stored.',
          },
          {
            title: 'Read the report before you clean',
            text: 'Open “report” on the result to see exactly which blocks were in your file — the C2PA manifest, the IPTC field, GPS coordinates, camera serial numbers. This is the part most tools skip.',
          },
          {
            title: 'Save the cleaned copy and upload that',
            text: 'Keep the original somewhere safe. Post the cleaned file. If you shoot on a phone, this also removes the GPS coordinates that would otherwise travel with the photo.',
          },
        ],
      },
      { t: 'tool' },

      { t: 'h2', text: 'What this does not do' },
      {
        t: 'warn',
        title: 'Metadata is not the only signal',
        text: 'Meta also runs its own classifiers on the pixels, and some generators — Google’s Imagen family among them — embed an invisible SynthID watermark that lives in the pixels and survives metadata stripping, re-encoding and resizing by design. Removing metadata removes the most common trigger. It is not a guarantee, and any tool that promises one is lying to you.',
      },
      {
        t: 'p',
        text: 'There is also a rule side to this. Meta asks you to disclose realistic AI-generated content yourself, and from August 2026 the EU AI Act requires machine-readable AI disclosure on content distributed in Europe. Stripping metadata off a photograph you took is a privacy measure. Stripping it off a fully generated image to pass it off as a photograph is a different act, and this tool will not help you argue otherwise.',
      },

      { t: 'h2', text: 'A note for photographers' },
      {
        t: 'p',
        text: 'The most common reason a real photograph gets labelled is a small generative edit: content-aware fill to remove a stray object, an AI denoise pass on a night shot, or a recent Lightroom feature. Modern Adobe exports stamp the whole file as AI-touched even when the generative part was a few hundred pixels in a corner. Cleaning the metadata returns the file to roughly what a plain camera export would have contained.',
      },
    ],
    faq: [
      [
        'Does removing metadata guarantee Instagram will not label my post?',
        'No. It removes the metadata trigger, which is what causes the large majority of labels, but Meta also runs pixel-level classifiers and some images carry invisible watermarks that no metadata tool can touch. Think of it as removing the data your file carries, which is exactly what it does.',
      ],
      [
        'Will Instagram know I removed the metadata?',
        'There is nothing to detect. A file without a C2PA manifest looks like any of the billions of images that never had one — screenshots, camera exports, older photos. Absence is the normal state, not a signal.',
      ],
      [
        'Does this reduce my image quality?',
        'The image is re-encoded once. At the default 92% quality that is not visible at Instagram viewing sizes, and Instagram re-compresses everything you upload anyway. If you want exact pixels, choose PNG output and switch the fingerprint reset off.',
      ],
      [
        'Can I do this on my phone?',
        'Yes. The tool runs in mobile browsers, and on iOS it handles HEIC files straight from the camera roll, returning them as JPEG since no browser can encode HEIC.',
      ],
    ],
    related: ['facebook', 'threads', 'what-is-c2pa-content-credentials'],
  },

  /* ------------------------------------------------------------- facebook */
  {
    slug: 'facebook',
    kind: 'platform',
    title: 'Why does Facebook say my photo is AI when it isn’t?',
    metaTitle: 'Facebook says my photo is AI but it isn’t — why, and the fix',
    description:
      'Facebook’s AI label is triggered by metadata written at export, not by the picture. Here is why real photographs get labelled, and how to strip the fields that cause it.',
    eyebrow: 'facebook',
    answer:
      'Because Facebook is not judging your photograph — it is reading a metadata field that your editor wrote. If you used generative fill, an AI denoise, or almost any recent Adobe feature, the export stamps the whole file as AI-touched even when the edit was trivial. Remove those fields and the trigger goes with them.',
    updated: '2026-08-24',
    blocks: [
      { t: 'h2', text: 'This is a false positive, and it is a known one' },
      {
        t: 'p',
        text: 'When Meta rolled the label out across Facebook, Instagram and Threads, photographers immediately found real work being tagged. A press photographer who cropped an image in Photoshop, a wedding shooter who ran a denoise pass, a retoucher who removed a bin from the corner of a landscape — all labelled. The pictures were photographs. The metadata said otherwise.',
      },
      {
        t: 'p',
        text: 'The reason is that C2PA provenance is coarse. When Photoshop writes its manifest it records that a generative feature was used somewhere in the session. There is no field for “only on 0.4% of the pixels”. Facebook reads the manifest, sees generative AI, and applies the label.',
      },

      { t: 'h2', text: 'Which edits are most likely to trigger it' },
      {
        t: 'ul',
        items: [
          'Generative Fill or Generative Expand in Photoshop, even on a tiny selection.',
          'AI Denoise and Lens Blur in Lightroom or Camera Raw.',
          'Content-aware removal tools in recent Adobe releases.',
          'Any export from Adobe Firefly, or a file that once passed through it.',
          'Phone camera modes that composite frames with a neural model, on some recent handsets.',
        ],
      },
      {
        t: 'note',
        title: 'Check before you assume',
        text: 'Run your file through the scanner below and open the report. It shows you the exact blocks in your file — if a C2PA manifest or an IPTC digitalSourceType field is there, that is your answer. If neither is present, something else is going on, most likely Facebook’s own pixel classifier.',
      },
      { t: 'tool' },

      { t: 'h2', text: 'Fixing it' },
      {
        t: 'steps',
        items: [
          {
            title: 'Clean the exported file',
            text: 'Drop the final export in above and save the cleaned copy. The C2PA manifest, XMP history and IPTC fields are removed; the picture is untouched apart from one re-encode.',
          },
          {
            title: 'Keep your original',
            text: 'Cleaning is one-way. Archive the untouched export in case you need the provenance record later — for a client, a competition entry, or a licensing claim.',
          },
          {
            title: 'Consider changing your export settings',
            text: 'Adobe apps let you turn Content Credentials off at export in most recent versions. Doing that at the source is cleaner than fixing every file afterwards.',
          },
        ],
      },

      { t: 'h2', text: 'The honest boundary' },
      {
        t: 'warn',
        title: 'This is for correcting false positives',
        text: 'If your image genuinely is AI-generated, removing the metadata does not make that untrue, and it will not fool a pixel classifier or an invisible watermark. Meta asks you to disclose realistic AI content, and from August 2026 the EU AI Act requires machine-readable disclosure for content distributed in Europe. Use this to stop a real photograph being mislabelled, not to hide what something is.',
      },
    ],
    faq: [
      [
        'Why did Facebook label a photo I took with my own camera?',
        'Almost always because you edited it in software that writes C2PA content credentials, and that software recorded a generative feature being used in the session. The label follows the metadata, not the pixels.',
      ],
      [
        'Can I appeal the label instead of removing metadata?',
        'Meta has adjusted how prominently the label is shown after the initial complaints, but there is no reliable per-post appeal. Cleaning the file before upload is the practical route.',
      ],
      [
        'Does this work for Facebook Pages and ads too?',
        'The metadata trigger is the same wherever the file is uploaded. Ad review has additional policy layers that have nothing to do with metadata, so treat those separately.',
      ],
    ],
    related: ['instagram', 'threads', 'what-is-c2pa-content-credentials'],
  },

  /* -------------------------------------------------------------- threads */
  {
    slug: 'threads',
    kind: 'platform',
    title: 'Removing the AI label on Threads',
    metaTitle: 'Remove the AI label on Threads — free metadata cleaner',
    description:
      'Threads uses the same Meta labelling pipeline as Instagram and Facebook: the AI label comes from C2PA and IPTC metadata in the file. Strip it in your browser before posting.',
    eyebrow: 'threads',
    answer:
      'Threads shares Meta’s labelling pipeline with Instagram and Facebook, so the trigger is identical: C2PA content credentials, IPTC digitalSourceType, or XMP fields naming a generative tool. Clean the file before you post and the metadata trigger is gone.',
    updated: '2026-08-24',
    blocks: [
      { t: 'h2', text: 'Same pipeline, same trigger' },
      {
        t: 'p',
        text: 'There is nothing Threads-specific about this. Meta applies one labelling system across its apps, so anything that gets tagged on Instagram gets tagged on Threads, and the fix is the same file-level cleanup. If you cross-post, clean once and use the cleaned file everywhere.',
      },
      {
        t: 'p',
        text: 'Threads posts tend to be screenshots, memes and reposts more often than original photography, which brings a wrinkle worth knowing: a screenshot of an AI image usually carries no AI metadata at all, because the screenshot is a fresh capture. What it does carry is your device model and, on some systems, the app you captured from.',
      },
      { t: 'tool' },

      { t: 'h2', text: 'What to check on a reposted image' },
      {
        t: 'ul',
        items: [
          'Downloaded images often keep the original generator’s metadata intact — repost one and the label follows you, not the person who made it.',
          'Screenshots usually drop the AI metadata but add device information of your own.',
          'Images pulled out of a chat app are frequently already stripped, because several messengers re-encode on send.',
        ],
      },
      {
        t: 'note',
        title: 'Run it and see',
        text: 'Rather than guessing which of those applies, drop the file in above. The report lists exactly what is in it, which takes about a second and settles the question.',
      },

      { t: 'h2', text: 'The limits, plainly' },
      {
        t: 'warn',
        title: 'Metadata only',
        text: 'This removes fields from the file. It does not touch invisible in-pixel watermarks such as SynthID, and it does not affect Meta’s own image classifiers. Where you are required to disclose AI-generated content — by Meta’s rules or, from August 2026, by the EU AI Act for content distributed in Europe — disclose it.',
      },
    ],
    faq: [
      [
        'Is the Threads AI label different from Instagram’s?',
        'No. Both come from the same Meta labelling system reading the same metadata fields, so the same cleanup applies to both.',
      ],
      [
        'Does a screenshot remove AI metadata?',
        'Usually yes, because a screenshot is a new capture that never had the original file’s fields. But it adds your own device information, and it costs you image quality. Cleaning the original file is better on both counts.',
      ],
    ],
    related: ['instagram', 'facebook', 'pinterest'],
  },

  /* ------------------------------------------------------------ pinterest */
  {
    slug: 'pinterest',
    kind: 'platform',
    title: 'Removing AI metadata before pinning to Pinterest',
    metaTitle: 'Pinterest AI label — remove AI metadata before you pin',
    description:
      'Pinterest reads image metadata to flag AI-modified content, and Pins carry your EXIF and GPS unless you strip them. Clean both in your browser, free and without uploading.',
    eyebrow: 'pinterest',
    answer:
      'Pinterest flags generative content using a mix of embedded metadata and its own classifiers. Removing the C2PA manifest, IPTC digitalSourceType and generator tags takes away the metadata half — and, since Pins are public and permanent, it also gets your GPS coordinates and camera serial out of the file.',
    updated: '2026-08-24',
    blocks: [
      { t: 'h2', text: 'Pinterest is a two-signal platform' },
      {
        t: 'p',
        text: 'Unlike Meta, Pinterest has leaned on classifiers as much as on metadata for identifying generative imagery. That means metadata cleanup helps, but it is only part of the picture: a fully generated image may still be recognised from its pixels. Be realistic about which half you are addressing.',
      },
      {
        t: 'h2',
        text: 'The privacy angle matters more here than anywhere else',
      },
      {
        t: 'p',
        text: 'Pins are public, indexed, and endlessly re-saved by other people. A Pin with GPS coordinates in its EXIF hands out the location of your home, studio or shop to anyone who downloads the file — and every re-pin carries a copy. Sellers and creators posting product shots from home should treat stripping metadata as routine rather than optional.',
      },
      {
        t: 'ul',
        items: [
          'GPS coordinates, down to a few metres.',
          'Camera make, model and body serial number, which links every photo you have ever posted to the same device.',
          'Timestamps, which reveal your shooting and posting patterns.',
          'IPTC creator and copyright fields, if you ever filled them in.',
        ],
      },
      { t: 'tool' },

      { t: 'h2', text: 'A practical workflow for bulk pinning' },
      {
        t: 'steps',
        items: [
          {
            title: 'Batch up to twenty files',
            text: 'Drop a whole set in at once. Each one is scanned and cleaned separately, and you get a report per file.',
          },
          {
            title: 'Set a max edge if you are pinning at scale',
            text: 'Pinterest displays at modest sizes. Capping the long edge at 2048 px keeps quality high while cutting upload weight considerably.',
          },
          {
            title: 'Download the lot as one ZIP',
            text: 'When more than one file is done, a single download button packages them together.',
          },
        ],
      },
    ],
    faq: [
      [
        'Does Pinterest strip EXIF from Pins automatically?',
        'Do not rely on it. Platform re-encoding behaviour changes without notice and differs between upload paths — web, app, browser extension, API. Cleaning before upload is the only way to know.',
      ],
      [
        'Will removing metadata stop Pinterest flagging AI content?',
        'It removes the metadata signal. Pinterest also uses pixel-level detection, so a fully generated image can still be recognised. This is a privacy and provenance tool, not a detection bypass.',
      ],
      [
        'How many images can I clean at once?',
        'Twenty per batch, up to 25 MB each, with no daily limit. Everything runs on your own machine, so your CPU is the only constraint.',
      ],
    ],
    related: ['instagram', 'linkedin', 'what-is-c2pa-content-credentials'],
  },

  /* ------------------------------------------------------------- linkedin */
  {
    slug: 'linkedin',
    kind: 'platform',
    title: 'Content Credentials on LinkedIn, and how to remove them',
    metaTitle: 'LinkedIn content credentials — remove the C2PA icon from images',
    description:
      'LinkedIn shows a Content Credentials icon on images carrying a C2PA manifest. Here is what that icon reveals about your file and how to remove the manifest before posting.',
    eyebrow: 'linkedin',
    answer:
      'LinkedIn participates in C2PA and shows a small Content Credentials icon on images that carry a signed manifest. Clicking it reveals which tool made the file and whether generative AI was involved. Removing the manifest removes the icon — and with it a disclosure you may not have intended to publish.',
    updated: '2026-08-24',
    blocks: [
      { t: 'h2', text: 'What the icon actually exposes' },
      {
        t: 'p',
        text: 'A C2PA manifest is not a single yes-or-no flag. It is a signed record, and viewers can open it. Depending on what wrote the file it can show the application and version, when it was produced, which editing actions were applied, whether a generative feature was used, and sometimes an account or organisation name.',
      },
      {
        t: 'p',
        text: 'On a professional network that is a meaningful amount of context to attach to a post without thinking about it. A consultant’s carousel that quietly announces which stock tool built it, or a company graphic whose manifest names an individual designer’s account, is publishing more than the picture.',
      },
      {
        t: 'note',
        title: 'Sometimes you want to keep it',
        text: 'Content Credentials exist for a good reason. If you are a photojournalist, a documentary photographer, or anyone whose work depends on being able to prove provenance, that manifest is an asset — keep it. This page is for the case where it is an unintended disclosure, not an argument that provenance is bad.',
      },
      { t: 'tool' },

      { t: 'h2', text: 'The other fields worth checking on a work post' },
      {
        t: 'ul',
        items: [
          'XMP CreatorTool, which names the software down to the version.',
          'IPTC creator, credit and copyright fields, often auto-filled with a name or an employer.',
          'EXIF camera serial numbers, which tie every image you have posted to one body.',
          'GPS coordinates on phone photos taken at an office, a client site or an event.',
        ],
      },
      {
        t: 'p',
        text: 'Open the report on any file you drop in above and you will see each of these listed with its decoded value, before anything is changed. Most people are surprised by at least one entry.',
      },
    ],
    faq: [
      [
        'Does removing Content Credentials look suspicious?',
        'No. The overwhelming majority of images on any platform have never carried a manifest — screenshots, exports from older software, anything from a phone camera. An image without credentials is the ordinary case.',
      ],
      [
        'Can I remove the manifest but keep my copyright info?',
        'Not with this tool: the canvas pass drops every metadata block at once. If you need to keep specific IPTC fields, clean the file here first and then re-add only the fields you want in your editor.',
      ],
      [
        'Is a C2PA manifest the same as a watermark?',
        'No, and the difference matters. A manifest is metadata stored beside the picture and can be removed. A watermark such as SynthID is encoded into the pixels themselves and survives metadata removal, re-encoding and resizing.',
      ],
    ],
    related: ['what-is-c2pa-content-credentials', 'pinterest', 'facebook'],
  },
];
