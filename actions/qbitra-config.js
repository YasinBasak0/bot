  const config = {
    // Auth Environment
    auth: {
      authUrl: 'https://gatewaytest.qbitra.io/api',
      authClientId: 'eb117e68-450c-4d7a-8899-d746bfaf1cb4',
      authClientSecret: '$2b$10$6JKfX7xFvghdWHoXSGtDKu'
    },
    // Session Environment
    session: {
      sessionUrl: 'https://gatewaytest.qbitra.io/session-server/api',
      sessionClientId: '8d516389-936c-4696-8bbe-870ce4048d0c',
      sessionClientSecret: 'AqTQPaaGZInSssj1fy5z'
    },
    // DialogFlow Environment
    dfkey: {
      type: 'service_account',
      project_id: 'newagent-xpqy',
      private_key_id: 'ee8ecc4951ca83105e43de1d508a04b8a7a3462e',
      private_key:
        '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDXvmgyoJY7AN+B\nwJs6cE29yj+APikUHvN6igvczzB+9C3TazVOAI0Sl6sqNypy+3HgqE7W07WdHpgQ\nvsi79lQDdM07DcZcgTuAR9ZmsWamNiFJ7yhAiHiIfw5ZjUg/XDefyyflLG2YCZmV\nZhuVjY3DomgpFIlkfkIuZXYHDkne4AqIJIYaBxQmxU07pw/MHpPA6Xu7h2VPcWTV\n5tKS2Dlt5u1Fq9MFBBz81Mrfdym58RGuo7i22oUr/XOmatROtPWgdBWUvrs2yGrH\nfhJ/O3nyMEJgsevjkWB+l8FsNE9zCSkzTM6fEFBnOcUO+yO3Q6AkEnr2RpaLshD/\npHINZj9/AgMBAAECggEAAPxnwMnVnEigPp52jmD9/zi0hYhrhTqYaC4UuXECKj/0\nFakSnfLVU4eMmZTmTU/IbXKvIoo6oO9GeaWp8a2UGjFBozyMVNbofig4FLOSTPYT\ndsm4Wy5SgqP6VlhL/TcgGUtmQBkMiczmQMIR/YtVw9Y9kW4cL5BKShHo6IFRvvft\n+pv5Jgtf/vFJfIAIbzl289O5F8MPSjKxQVtJQEIY2/yLZB/+XOLJXuLnCu4sEKXR\nDNUrbGJUw7BzbikCJfRyU2V1mop4g05qA5WAfbheiBGoGyiP8BVVRPSadIMDhbNg\nlRO3hGTx32VlKMFKlDn9jfU3Ge+li9BOSkkxPxjHgQKBgQD/avjxX/+C3kVblkRc\nYKVdMO8nAyDIlakabbzdb/0Nh80UrBwG7zAGDG2oGscFQ3CjF987frtdQESEeVBo\nAp1Dcl44331DCmm73HmiJeQvyZ9zKxJ+WFoVz2LXSuxtlTJkSifm4ioXJcaHrQyQ\nLgjyEPS5GJ5OVPJhHQX53R5XCQKBgQDYPEk/Qtr4NnLukqoTISmPPbJnATFIDNwB\n0VBhqugsUbLfbXQxSxS2nxkZYVfTypn1LSF4zNJlL9vgWITZd0H7eHSk+WJENo9v\nG2PfB3zG1VHOpzw1KioxT4+3WC4wCEZ8fX7t6zLsA7EaPrmc9sICa/u9WH+afu5Q\n78zocGY8RwKBgFT2GGjyLeQyW4/jpEm2PEuLg4HOoJEYd2+7IR/nqJ1flvBRb+E+\nnxLj/3XzslAl5snZnwADX//c6O3IDN8MP5O372+rp9ctF47OAAfX4teikc+VfEla\nylyG57IF0i+BeYmywSMkCCw6/JcVESDEr2UWDtGjRsV3rEhxhxNeYkFBAoGAGeF9\nUtkJpFPABdYADTIW61ITHEkEQP9pBb6rxETUbRmKMzvCgHPgEsuQEX2ZKXxCWRoB\nu5eoRvwncP6nR/ACMbsFGwnOPSPanw3EMlmPEa1OkVFq32Igkq5XITaosI8NALF0\nk71m5uC6Pc3sIWFXbzrFcrA49aDjnURWXiu10NkCgYEAlq4Jz9OrXMZMq5Tz3UzC\nUGn0rc7VBIMJmdEHK25ZRo9D30YJzJ0ERWqfPlqMR/huJcIArYxmoksO/VL/NnVX\ne6vwRZeSIAIca0wzi3MasbOaNjvKISeOWrj9dguFwI8JBSkKjwGzJs7uB81vPkVb\nKrf2BK8vx4IsYqD8VzFGtMQ=\n-----END PRIVATE KEY-----\n',
      client_email: 'df-960@newagent-xpqy.iam.gserviceaccount.com',
      client_id: '107594885855519195412',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url:
        'https://www.googleapis.com/robot/v1/metadata/x509/df-960%40newagent-xpqy.iam.gserviceaccount.com'
    }
  }

  module.exports.config = config