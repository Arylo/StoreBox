# Store Box

Store PandoraBox Firmware Images and its packages

[![Travis](https://img.shields.io/travis/Arylo/StoreBox.svg?style=flat-square)](https://travis-ci.org/Arylo/StoreBox)
[![Coveralls](https://img.shields.io/coveralls/github/Arylo/StoreBox.svg?style=flat-square)](https://coveralls.io/github/Arylo/StoreBox)
[![license](https://img.shields.io/github/license/Arylo/StoreBox.svg?style=flat-square)](https://github.com/Arylo/storebox)

# Usage

## Docker Edition

```bash
docker pull arylo/storebox
docker run -p 9000:9000 arylo/storebox
```

or

```bash
docker build -t arylo/storebox .
docker run -p 9000:9000 arylo/storebox
```

### Docker-compose

in `./docker`

```bash
docker-compose up -d
```

## Nodejs Edition

```bash
npm install
npm run start:prod
```

### Get Api Docs

1. Run command on your shell

```bash
npm run start:dev
```

2. Open the api doc url(default port: 9000) on your browser

```
http://127.0.0.1:9000/docs
```

# License (MIT)

>  Copyright (C) 2017 by AryloYeung
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.