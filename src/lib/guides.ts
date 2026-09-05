import type { Doc } from './content';

export const GUIDES: Doc[] = [
  /* ------------------------------------------------------------ c2pa */
  {
    slug: 'what-is-c2pa-content-credentials',
    kind: 'guide',
    title: 'What is C2PA, and how do I remove content credentials?',
    metaTitle: 'What is C2PA? Remove content credentials',
    description:
      'C2PA content credentials are a signed record of how an image was made. What is inside one, how to inspect it, and how to remove it in your browser.',
    eyebrow: 'guide',
    answer:
      'C2PA is a provenance standard: a cryptographically signed manifest embedded in an image that records which tool made or edited it, when, and whether generative AI was involved. Platforms read it to apply AI labels. It is metadata, so it can be inspected and removed — including in the tool on this page.',
    updated: '2026-08-24',
    blocks: [
      { t: 'h2', text: 'What the standard actually is' },
      {
        t: 'p',
        text: 'C2PA — the Coalition for Content Provenance and Authenticity — is a specification backed by Adobe, Microsoft, the BBC, camera makers and several AI companies. Its goal is to make it possible to answer “where did this image come from?” without relying on the person posting it. The user-facing brand name for the same thing is Content Credentials.',
      },
      {
        t: 'p',
        text: 'The mechanism is a manifest: a block of structured, signed data stored inside the file. In a JPEG it lives in an application segment; in a PNG it is a caBX chunk; in AVIF and HEIC it sits in the metadata box. Because it is signed, tampering with it is detectable — but removing it entirely is not, because an image with no manifest is indistinguishable from the billions that never had one.',
      },

      { t: 'h2', text: 'What is inside a manifest' },
      {
        t: 'ul',
        items: [
          'The claim generator — the application and version that wrote it, for example Adobe Photoshop 26.0.',
          'Assertions about what was done: which editing actions were applied, and whether any of them were generative.',
          'An ingredients list, linking to earlier versions of the file, which can chain back through an entire edit history.',
          'A timestamp, and a signature tied to a certificate identifying the signer.',
          'Sometimes an account or organisation name belonging to whoever produced the file.',
        ],
      },
      {
        t: 'note',
        title: 'This is a genuinely good idea, used badly in one case',
        text: 'Provenance data helps newsrooms verify images and helps photographers prove authorship. The problem is not the standard. It is that platforms turned a rich provenance record into a binary AI label, so an edit touching a fraction of a percent of the pixels gets the same treatment as a fully generated picture.',
      },

      { t: 'h2', text: 'Inspect before you remove' },
      {
        t: 'p',
        text: 'Drop any image below and open the report. You will see whether a C2PA manifest is present and how large it is, alongside every other block in the file — EXIF, XMP, IPTC, GPS, PNG text chunks — with the decoded values printed out. Nothing is uploaded; the file is read into this tab and parsed byte by byte on your own machine.',
      },
      { t: 'tool' },

      { t: 'h2', text: 'How removal works' },
      {
        t: 'steps',
        items: [
          {
            title: 'The image is decoded to pixels',
            text: 'Orientation from EXIF is applied first, so a rotated phone photo does not flip once the EXIF block is gone.',
          },
          {
            title: 'The pixels are painted onto a canvas',
            text: 'A canvas holds nothing but pixel values. Every metadata block — manifest included — is left behind at this step, because there is nowhere in a canvas for it to live.',
          },
          {
            title: 'A fresh file is encoded from the canvas',
            text: 'What comes out is a new file built only from the pixels. The one thing your browser writes back is a colour profile, which carries no identifying history.',
          },
        ],
      },
      {
        t: 'p',
        text: 'This is why the approach is thorough rather than clever: it does not try to find and delete each block, which risks missing one. It throws away everything except the picture.',
      },

      { t: 'h2', text: 'When you should not remove it' },
      {
        t: 'warn',
        title: 'Provenance can be the point',
        text: 'If you are a photojournalist, a documentary photographer, an expert witness, or anyone whose work depends on proving how a file was made, the manifest is evidence. Removing it destroys that. Keep an untouched original archived whenever you clean a working copy, and be aware that from August 2026 the EU AI Act requires machine-readable AI disclosure on content distributed in Europe.',
      },
    ],
    faq: [
      [
        'Can C2PA metadata be removed?',
        'Yes. It is metadata stored in the file, so re-encoding the image from its pixels drops it along with every other block. The signature makes tampering detectable, but complete removal is not detectable — an image with no manifest looks like any ordinary photo or screenshot.',
      ],
      [
        'Does removing C2PA damage the image?',
        'No. The picture is re-encoded once, which at high quality is not visible at normal viewing sizes. Choose PNG output if you need pixel-exact results.',
      ],
      [
        'Which tools write C2PA manifests?',
        'Adobe Firefly and recent Photoshop and Lightroom releases, several AI image generators, and a growing number of cameras from Leica, Sony, Nikon and Canon. The list expands steadily.',
      ],
      [
        'Is C2PA the same as an invisible watermark?',
        'No. C2PA is metadata beside the picture and can be removed. A watermark such as Google’s SynthID is encoded into the pixels and survives metadata stripping, re-encoding and resizing.',
      ],
    ],
    related: ['instagram', 'linkedin', 'remove-stable-diffusion-prompt-from-png'],
  },

  /* -------------------------------------------------- stable diffusion png */
  {
    slug: 'remove-stable-diffusion-prompt-from-png',
    kind: 'guide',
    title: 'How to remove the Stable Diffusion prompt from a PNG',
    metaTitle: 'Remove a Stable Diffusion prompt from a PNG',
    description:
      'Automatic1111, ComfyUI and Forge write your prompt, seed, sampler and model hash into PNG text chunks. How to see them, and how to strip them out.',
    eyebrow: 'guide',
    answer:
      'Stable Diffusion interfaces store generation parameters in PNG text chunks — tEXt, iTXt and zTXt — under keys like “parameters” or “workflow”. Anyone who downloads your image can read them with a text editor. Re-encoding the image drops every chunk, taking the prompt, seed, sampler, CFG scale and model hash with it.',
    updated: '2026-08-24',
    blocks: [
      { t: 'h2', text: 'What your PNG is publishing' },
      {
        t: 'p',
        text: 'A PNG is a sequence of labelled chunks. Alongside the ones that hold the pixels, the format allows arbitrary text chunks, and Stable Diffusion front-ends use them to store everything needed to reproduce an image. Open a generated PNG in a text editor and you can often read the prompt in plain sight.',
      },
      {
        t: 'ul',
        items: [
          'The positive prompt in full, including anything you typed and forgot about.',
          'The negative prompt.',
          'Seed, sampler, step count, CFG scale and denoising strength.',
          'The model name and its hash, plus any LoRAs and their weights.',
          'In ComfyUI, the entire node graph as JSON — your whole workflow.',
        ],
      },
      {
        t: 'note',
        title: 'This is how prompt-scraping works',
        text: 'People routinely harvest prompts from images posted publicly. If you have spent time developing a style or a workflow, posting the raw PNG hands it over intact. Nothing has to be hacked; the data is in the file you uploaded.',
      },

      { t: 'h2', text: 'See what is in your own file' },
      {
        t: 'p',
        text: 'Drop a generated PNG below and open the report. The scanner walks the chunk list and prints each text chunk it finds, with the parsed parameters shown separately — steps, sampler, CFG, seed. It runs entirely in this tab, which matters here: uploading a prompt you want to keep private to a random cleaning service defeats the purpose.',
      },
      { t: 'tool' },

      { t: 'h2', text: 'Two things people get wrong' },
      {
        t: 'h3',
        text: 'Renaming the file does nothing',
      },
      {
        t: 'p',
        text: 'The chunks are inside the file, not in its name. Renaming, moving or zipping it changes nothing at all.',
      },
      {
        t: 'h3',
        text: 'Converting PNG to JPEG is not reliably enough',
      },
      {
        t: 'p',
        text: 'Some converters carry text across into JPEG comment or XMP blocks rather than dropping it, and you lose quality for a job it may not have finished. Re-encoding from a canvas, which is what happens above, discards every chunk by construction — there is nowhere for them to survive.',
      },

      { t: 'h2', text: 'Keeping your parameters without publishing them' },
      {
        t: 'steps',
        items: [
          {
            title: 'Archive the original',
            text: 'Keep the untouched PNG in a local folder. That is your record of how the image was made, and you can always reproduce it.',
          },
          {
            title: 'Clean the copy you post',
            text: 'Upload the cleaned file only. Choose PNG output if you want the pixels untouched, or JPEG if file size matters more.',
          },
          {
            title: 'Check your generator’s settings',
            text: 'Automatic1111 has an option to stop writing parameters into the file at all. Turning it off at the source saves you doing this every time — though it also means the original loses its record, so decide which you want.',
          },
        ],
      },
      {
        t: 'warn',
        title: 'What this does not remove',
        text: 'Some models embed an invisible watermark in the pixels, and AI detectors work on pixels rather than tags. Removing chunk data removes your prompt and your workflow from public view. It does not make a generated image read as a photograph, and it is not a way around disclosure rules where they apply.',
      },
    ],
    faq: [
      [
        'Where exactly does Stable Diffusion store the prompt?',
        'In PNG text chunks — usually a tEXt chunk with the key “parameters” in Automatic1111 and Forge, or an iTXt chunk holding the workflow JSON in ComfyUI. Some builds use compressed zTXt chunks, which are not human-readable but trivially decompressed.',
      ],
      [
        'Can I remove just the prompt and keep other metadata?',
        'Not with this tool — the canvas pass drops everything at once. That is deliberate: partial removal is where leaks happen, because parameters often appear in more than one block.',
      ],
      [
        'Does this work on ComfyUI workflow data?',
        'Yes. The workflow JSON lives in the same text chunks and goes with them. The report will show you the chunk and its size before you clean it.',
      ],
      [
        'What about images from Midjourney or DALL·E?',
        'Those write different fields — usually XMP or a C2PA manifest rather than PNG chunks — but the same pass removes them. The report names whichever ones your file actually has.',
      ],
    ],
    related: ['what-is-c2pa-content-credentials', 'instagram', 'pinterest'],
  },
];
