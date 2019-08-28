/* eslint-disable no-console */
const request = require('request');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs');

const obtemjsonTrackInfo = arquivo => {
  let jsonTrackInfo;
  arquivo.split('\n').forEach(linha => {
    if (linha.includes('trackinfo:')) {
      let linhaFormatada = linha
        .slice(0, linha.length - 1)
        .replace('trackinfo:', '')
        .trim();
      jsonTrackInfo = JSON.parse(linhaFormatada);
    }
  });
  return jsonTrackInfo;
};

const obtemNomeAlbum = arquivo => {
  let nomeAlbum;
  arquivo.split('\n').forEach(linha => {
    if (linha.includes('album_title:')) {
      return (nomeAlbum = linha.split('"')[1].replace(/\W+/g, ' '));
    }
  });
  return nomeAlbum;
};

const obtemjsonDeMusicas = jsonTrackInfo => {
  const jsonDeMusicas = jsonTrackInfo
    .filter(element => element.file)
    .map(element => {
      return {
        url: element.file['mp3-128'],
        title: element.title.replace(/\W+/g, ' ')
      };
    });
  return jsonDeMusicas;
};

const obtemMusicas = async (nomeAlbum, musica) => {
  const writer = fs.createWriteStream(
    path.join(nomeAlbum, `${musica.title}.mp3`)
  );

  const response = await request.get(musica.url).on('error', err => {
    throw err;
  });

  response.pipe(
    writer,
    console.log(`Baixando música ${musica.title}.mp3`)
  );

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
};
const argv = yargs.alias('u', 'url').demandOption('url').argv;

request(argv.url, async (err, res, body) => {
  if (err) throw err;

  const html = await body;
  const jsonTrackInfo = obtemjsonTrackInfo(html);
  const nomeAlbum = obtemNomeAlbum(html);
  const jsonDeMusicas = obtemjsonDeMusicas(jsonTrackInfo);

  if (!fs.existsSync(nomeAlbum)) fs.mkdirSync(nomeAlbum);

  for (let element of jsonDeMusicas) {
    await obtemMusicas(nomeAlbum, element);
  }
  console.log('Fim! :)');
});
