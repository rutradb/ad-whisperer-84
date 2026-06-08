[Skip to main content](https://developers.google.com/google-ads/api/docs/get-started/make-first-call#main-content)

[![Google Ads API](https://developers.google.com/static/ads/images/ads_192px_clr.svg)](https://developers.google.com/google-ads/api)

- [GoogleAds API](https://developers.google.com/google-ads/api)

`/`

- English
- Deutsch
- Español
- Español – América Latina
- Français
- Indonesia
- Italiano
- Polski
- Português – Brasil
- Tiếng Việt
- Türkçe
- Русский
- עברית
- العربيّة
- فارسی
- हिंदी
- বাংলা
- ภาษาไทย
- 中文 – 简体
- 中文 – 繁體
- 日本語
- 한국어

Sign in

Join us live on [Discord](https://discord.com/events/971845904002871346/1492135554966360125) on the Google Advertising and Measurement Community server and on [YouTube](https://www.youtube.com/watch?v=sw_YjsWhYlY) on April 23rd at 10:00 AM EST! We will discuss the new features added in v24 of the Google Ads API.


- [Home](https://developers.google.com/)
- [Products](https://developers.google.com/products)
- [Google Ads API](https://developers.google.com/google-ads/api)



 Send feedback



# Quick start    Stay organized with collections      Save and categorize content based on your preferences.

![Spark icon](https://developers.google.com/_static/images/icons/spark.svg)

## Page Summary

outlined\_flag

- A developer token is required to make API calls to the Google Ads API and its access level controls the number of daily calls and environments.

- You need a Google Ads manager account to obtain a developer token and a Google Ads client account is the target of your API calls, identified by a 10-digit client customer ID.

- Making an API call requires obtaining a developer token, configuring a Google Cloud project with a service account and key for authentication, and setting up your Google Ads client account, including granting the service account access.

- Depending on your preference for making API calls, you can either download a client library or use HTTP clients like curl or the Google Cloud CLI.

- To make an API call using a client library or curl, you will need to provide your developer token, client customer ID, and the JSON key file path for your service account credentials in the configuration.


This quick start guide helps you make your first API call to the Google Ads API.

## Key concepts

- [**Developer token**](https://developers.google.com/google-ads/api/docs/api-policy/developer-token): A developer token is an alphanumeric
string,
22 characters long, that identifies your app to the Google Ads API servers. It is
required to make API calls.
- [**API access level:**](https://developers.google.com/google-ads/api/docs/api-policy/access-levels) The API access level of your
developer token controls the number of API calls you can make per day and
the environments to which you can make API calls.
- [**Google Ads manager account:**](https://support.google.com/google-ads/answer/7459399) A Google Ads manager account is used
to manage other Google Ads accounts. A Google Ads manager account can be used to
manage Google Ads client accounts or other Google Ads manager accounts. You need a
Google Ads manager account to obtain a developer token.
- **Google Ads client account:** The Google Ads account you're making API calls
against.
- **Client customer ID:** The 10-digit number that identifies a Google Ads client
account. If you copied this ID from the Google Ads UI, make sure to remove the
hyphens.
- [**OAuth 2.0:**](https://oauth.net/2/) OAuth 2.0 is an industry-standard protocol for
authorization, used by all Google APIs. You need a service account and key
to generate OAuth 2.0 credentials to make API calls.
- [**Google Cloud project:**](https://developers.google.com/google-ads/api/docs/oauth/cloud-project) A Google Cloud project forms
the basis for creating, enabling, and using all the Google services,
including managing APIs and OAuth 2.0 API credentials. You can create one
from the [Google Cloud Console](https://console.cloud.google.com/).
- [**Service account:**](https://developers.google.com/google-ads/api/docs/oauth/service-accounts) A special type of Google Account that
belongs to your application rather than to an individual user. It is used to
authenticate your application to the Google Ads API. You need a Google Cloud
project to obtain a service account.
- **Service account key:** A JSON app credential file that contains the
private key for your service account. It is used to generate OAuth 2.0
credentials to authenticate a service account when making an Google Ads API API
call. You need a service account to obtain a service account key.

## Prerequisites

To make a Google Ads API call, you should complete the following steps.

### Obtain your Developer token

If you have signed up for a developer token in the past, you can find it by
visiting the [API Center](https://ads.google.com/aw/apicenter) while being logged into your Google Ads
manager account.

[Access API Center](https://ads.google.com/aw/apicenter)

If you don't have a developer token, you can sign up for one in the API Center.

#### How to sign up for a developer token

1. Navigate to [API Center](https://ads.google.com/aw/apicenter) in
    your web browser. Sign in to your Google Ads manager account if prompted.
    [Create a Google Ads\\
    manager account](https://support.google.com/google-ads/answer/7459399) if you don't have one.

2. Complete the **API Access form** and accept the
    **Terms and Conditions**.

   - Ensure that your information is correct and your company's website
      URL is functioning. If the website is not live, Google might not be able to
      process your application and reject it.
   - Ensure that the API contact email you provide leads to a regularly
      monitored inbox. Google's API compliance team might reach out to this email
      address during the review process for clarifications. If you can't be reached,
      Google might not continue with your application.
   - You can edit your **API contact email** in the **API Center**.
      Keep this information up-to-date, even after the application process, so
      Google can send you important service announcements.

After you've completed the application process, the developer token appears
in your API Center with a **Pending Approval** status. Your developer token
now has **Test Account Access** level.

### Configure your Google API Console project

The Google API Console project is used for managing Google APIs and OAuth 2.0 API
credentials. You can find your existing Google API Console projects or create one
by visiting [the Google API Console](https://console.cloud.google.com/).

[Open Google API Console](https://console.cloud.google.com/)

Start by enabling the Google Ads API in your project:

[Enable Google Ads API](https://console.cloud.google.com/flows/enableapi?apiid=googleads.googleapis.com)

Next, you need a service account and service account key to make API calls. If
you are already using another Google API and have created an OAuth 2.0 service
account and key, you can skip this step and reuse the existing credentials.

#### How to create a service account and key

1. In the Google Cloud console, go to Menu
    menu> **IAM & Admin** > **Service Accounts**.

[Go to Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)

2. Select your service account.
3. Click **Keys** > **Add key** > **Create new key**.
4. Select **JSON**, then click **Create**.

Your new public/private key pair is generated and downloaded to your
    machine as a new file. Save the downloaded JSON file as
    `credentials.json` in your working directory. This file is
    the only copy of this key.

5. Click **Close**.

### Configure your Google Ads client account

Start by identifying the Google Ads account you're making API calls against. The
type of account you can make API calls to depends on the
[API Access level](https://developers.google.com/google-ads/api/docs/api-policy/access-levels) of your developer token. Check your [API\\
Center](https://ads.google.com/aw/apicenter) to find out your API access level.

### Explorer, Basic & Standard Access levels

You can make calls to your Google Ads production account. However, you can
create a Google Ads test account by following the instructions on the **Test**
**Account Access** tab if required.

### Test Account Access level

Your developer token **cannot** be used to make API calls to a Google Ads
production account. You can make API calls against Google Ads test accounts
only.

#### How to create a Google Ads test account

The following instructions create a Google Ads test manager account and a
Google Ads test Google Ads advertiser account underneath it.

1. Click the blue button to create a Google Ads test manager account.
    If prompted, sign in with a Google Account that isn't linked to your
    Google Ads production manager account. If you don't have one, use the
    **Create account** button on that page to create a new Google
    Account.

[Create a Google Ads test manager account](https://ads.google.com/nav/selectaccount?sf=mt)

2. While in your Google Ads test manager account, create a Google Ads test
    customer account: Click **Accounts > add\_circle \> Create new account** and
    fill out the form. Any Google Ads accounts you create from your Google Ads test
    manager account are automatically Google Ads test accounts.
3. Optionally, create a few campaigns under the Google Ads test client
    account from the Google Ads page.

To make an API call to a Google Ads customer, you must grant access and appropriate
permissions to your service account to the Google Ads customer account. To do this,
you need administrator access to the customer account.

#### How to grant the service account access to your Google Ads  account

1. Start by signing in to your Google Ads account as an administrator.
2. Navigate to **Admin > Access and security**.
3. Click the add\_circle
    button under the **Users** tab.

![](https://developers.google.com/static/google-ads/api/images/sa-before-access.png)
4. Type the service account email address into the **Email** input box.
    Select the appropriate account access level and click the
    **Add account** button. Note that Email access level is not supported for
    service accounts.

![](https://developers.google.com/static/google-ads/api/images/sa-add-access.png)
5. The service account is granted access.

![](https://developers.google.com/static/google-ads/api/images/sa-has-access.png)
6. **\[Optional\]**By default, you cannot grant administrator access to a
    service account. If your API calls require administrator access, you can
    upgrade the access as follows.

1. Click the drop-down arrow next to the access level of the service
       account in the **Access level** column.
2. Select **Admin** from the drop-down list.

### Download tools and client libraries

You can choose to either download a client library or an HTTP client depending
on how you'd like to make API calls.

### Use a client library

Download and install a [client library](https://developers.google.com/google-ads/api/docs/client-libs) of your choice.

### Use HTTP client (REST)

**curl**

Download and install [curl](https://curl.se/download.html), the command line tool for
transferring data through a URL.

**The Google Cloud CLI**

Follow the [instructions](https://cloud.google.com/sdk/docs/install) to install gcloud CLI.

The instructions for the rest of this guide were verified to work with the
following version of the gcloud tool and might not work with previous
versions due to differences in application behavior or command-line options.

```
:~$ gcloud version
Google Cloud SDK 492.0.0
alpha 2024.09.06
beta 2024.09.06
bq 2.1.8
bundled-python3-unix 3.11.9
core 2024.09.06
enterprise-certificate-proxy 0.3.2
gcloud-crc32c 1.0.0
gsutil 5.30
```

## Make an API call

Select your client of choice for instructions on how to make an API call:

### Java

The client library artifacts are published to the [Maven central\\
repository](https://search.maven.org/artifact/com.google.api-ads/google-ads). Add
the client library as a dependency to your project as follows:

The Maven dependency is:

```
<dependency>
  <groupId>com.google.api-ads</groupId>
  <artifactId>google-ads</artifactId>
  <version>42.2.0</version>
</dependency>
```

The Gradle dependency is:

```
implementation 'com.google.api-ads:google-ads:42.2.0'
```

We also recommend using the [Google Ads API Bill of Materials\\
(BOM)](https://developers.google.com/google-ads/api/docs/client-libs/java/bill-of-materials) to manage dependency versions. See
the [BOM guide](https://developers.google.com/google-ads/api/docs/client-libs/java/bill-of-materials) for instructions.

Create a file `~/ads.properties` with the following content:

```
api.googleads.serviceAccountSecretsPath=JSON_KEY_FILE_PATH
api.googleads.developerToken=INSERT_DEVELOPER_TOKEN_HERE
api.googleads.loginCustomerId=INSERT_LOGIN_CUSTOMER_ID_HERE
```

Create a `GoogleAdsClient` object as follows:

```
GoogleAdsClient googleAdsClient = null;
try {
  googleAdsClient = GoogleAdsClient.newBuilder().fromPropertiesFile().build();
} catch (FileNotFoundException fnfe) {
  System.err.printf(
      "Failed to load GoogleAdsClient configuration from file. Exception: %s%n",
      fnfe);
  System.exit(1);
} catch (IOException ioe) {
  System.err.printf("Failed to create GoogleAdsClient. Exception: %s%n", ioe);
  System.exit(1);
}
```

Next, run a campaign report using the [`GoogleAdsService.SearchStream`](https://developers.google.com/google-ads/api/reference/rpc/v23/GoogleAdsService/SearchStream) method to retrieve the
campaigns in your account.

```
private void runExample(GoogleAdsClient googleAdsClient, long customerId) {
  try (GoogleAdsServiceClient googleAdsServiceClient =
      googleAdsClient.getLatestVersion().createGoogleAdsServiceClient()) {
    String query = "SELECT campaign.id, campaign.name FROM campaign ORDER BY campaign.id";
    // Constructs the SearchGoogleAdsStreamRequest.
    SearchGoogleAdsStreamRequest request =
        SearchGoogleAdsStreamRequest.newBuilder()
            .setCustomerId(Long.toString(customerId))
            .setQuery(query)
            .build();

    // Creates and issues a search Google Ads stream request that will retrieve all campaigns.
    ServerStream<SearchGoogleAdsStreamResponse> stream =
        googleAdsServiceClient.searchStreamCallable().call(request);

    // Iterates through and prints all of the results in the stream response.
    for (SearchGoogleAdsStreamResponse response : stream) {
      for (GoogleAdsRow googleAdsRow : response.getResultsList()) {
        System.out.printf(
            "Campaign with ID %d and name '%s' was found.%n",
            googleAdsRow.getCampaign().getId(), googleAdsRow.getCampaign().getName());
      }
    }
  }
}GetCampaigns.java
```

### C\#

The client library packages are published to the [Nuget.org\\
repository](https://www.nuget.org/packages/Google.Ads.GoogleAds). Start by adding
a nuget reference to `Google.Ads.GoogleAds` package.

```
dotnet add package Google.Ads.GoogleAds --version 25.1.0
```

Create a `GoogleAdsConfig` object with the relevant settings, and use it to
create a `GoogleAdsClient` object.

```
GoogleAdsConfig config = new GoogleAdsConfig()
{
    DeveloperToken = "******",
    OAuth2Mode = OAuth2Flow.SERVICE_ACCOUNT,
    OAuth2SecretsJsonPath = "PATH_TO_CREDENTIALS_JSON",
    LoginCustomerId = ******
};
GoogleAdsClient client = new GoogleAdsClient(config);
```

Next, run a campaign report using the [`GoogleAdsService.SearchStream`](https://developers.google.com/google-ads/api/reference/rpc/v23/GoogleAdsService/SearchStream) method to retrieve the
campaigns in your account. This guide doesn't cover the details of
[reporting](https://developers.google.com/google-ads/api/docs/reporting/overview).

```
public void Run(GoogleAdsClient client, long customerId)
{
    // Get the GoogleAdsService.
    GoogleAdsServiceClient googleAdsService = client.GetService(
        Services.V23.GoogleAdsService);

    // Create a query that will retrieve all campaigns.
    string query = @"SELECT
                    campaign.id,
                    campaign.name,
                    campaign.network_settings.target_content_network
                FROM campaign
                ORDER BY campaign.id";

    try
    {
        // Issue a search request.
        googleAdsService.SearchStream(customerId.ToString(), query,
            delegate (SearchGoogleAdsStreamResponse resp)
            {
                foreach (GoogleAdsRow googleAdsRow in resp.Results)
                {
                    Console.WriteLine("Campaign with ID {0} and name '{1}' was found.",
                        googleAdsRow.Campaign.Id, googleAdsRow.Campaign.Name);
                }
            }
        );
    }
    catch (GoogleAdsException e)
    {
        Console.WriteLine("Failure:");
        Console.WriteLine($"Message: {e.Message}");
        Console.WriteLine($"Failure: {e.Failure}");
        Console.WriteLine($"Request ID: {e.RequestId}");
        throw;
    }
}GetCampaigns.cs
```

### PHP

The client library packages are published to the [Packagist\\
repository](https://packagist.org/packages/googleads/google-ads-php). Change into
the root directory of your project and run the following command to install
the library and all its dependencies in the `vendor/` directory of your
project's root directory.

```
composer require googleads/google-ads-php:32.2.0
```

Make a copy of the
[`google_ads_php.ini`](https://github.com/googleads/google-ads-php/blob/main/examples/Authentication/google_ads_php.ini)
file from the GitHub repository and modify it to include your credentials.

```
[GOOGLE_ADS]
developerToken = "INSERT_DEVELOPER_TOKEN_HERE"
loginCustomerId = "INSERT_LOGIN_CUSTOMER_ID_HERE"

[OAUTH2]
jsonKeyFilePath = "INSERT_ABSOLUTE_PATH_TO_OAUTH2_JSON_KEY_FILE_HERE"
scopes = "https://www.googleapis.com/auth/adwords"
```

Create an instance of `GoogleAdsClient` object.

```
$oAuth2Credential = (new OAuth2TokenBuilder())
    ->fromFile('/path/to/google_ads_php.ini')
    ->build();

$googleAdsClient = (new GoogleAdsClientBuilder())
    ->fromFile('/path/to/google_ads_php.ini')
    ->withOAuth2Credential($oAuth2Credential)
    ->build();
```

Next, run a campaign report using the [`GoogleAdsService.SearchStream`](https://developers.google.com/google-ads/api/reference/rpc/v23/GoogleAdsService/SearchStream) method to retrieve the
campaigns in your account.

```
public static function runExample(GoogleAdsClient $googleAdsClient, int $customerId)
{
    $googleAdsServiceClient = $googleAdsClient->getGoogleAdsServiceClient();
    // Creates a query that retrieves all campaigns.
    $query = 'SELECT campaign.id, campaign.name FROM campaign ORDER BY campaign.id';
    // Issues a search stream request.
    /** @var GoogleAdsServerStreamDecorator $stream */
    $stream = $googleAdsServiceClient->searchStream(
        SearchGoogleAdsStreamRequest::build($customerId, $query)
    );

    // Iterates over all rows in all messages and prints the requested field values for
    // the campaign in each row.
    foreach ($stream->iterateAllElements() as $googleAdsRow) {
        /** @var GoogleAdsRow $googleAdsRow */
        printf(
            "Campaign with ID %d and name '%s' was found.%s",
            $googleAdsRow->getCampaign()->getId(),
            $googleAdsRow->getCampaign()->getName(),
            PHP_EOL
        );
    }
}GetCampaigns.php
```

### Python

The client library is distributed on [PyPI](https://pypi.org/project/google-ads/)
can be installed using the [`pip`](https://pip.pypa.io/en/stable/installing)
command as follows:

```
python -m pip install google-ads==29.2.0
```

Make a copy of the
[`google-ads.yaml`](https://github.com/googleads/google-ads-python/blob/HEAD/google-ads.yaml) file from the
GitHub repository and modify it to include your credentials.

```
developer_token: INSERT_DEVELOPER_TOKEN_HERE
login_customer_id: INSERT_LOGIN_CUSTOMER_ID_HERE
json_key_file_path: JSON_KEY_FILE_PATH_HERE
```

Create a `GoogleAdsClient` instance by calling the
`GoogleAdsClient.load_from_storage` method. Pass the path to your
`google-ads.yaml` as a string to the method when calling it:

```
from google.ads.googleads.client import GoogleAdsClient
client = GoogleAdsClient.load_from_storage("path/to/google-ads.yaml")
```

Add a handler to the library's logger telling it where to print logs.
The following will tell the library's logger to print to the console
(`stdout`).

```
import logging
import sys

logger = logging.getLogger('google.ads.googleads.client')
logger.addHandler(logging.StreamHandler(sys.stdout))
```

Next, run a campaign report using the [`GoogleAdsService.SearchStream`](https://developers.google.com/google-ads/api/reference/rpc/v23/GoogleAdsService/SearchStream) method to retrieve the
campaigns in your account.

```
def main(client: GoogleAdsClient, customer_id: str) -> None:
    ga_service: GoogleAdsServiceClient = client.get_service("GoogleAdsService")

    query: str = """
        SELECT
          campaign.id,
          campaign.name
        FROM campaign
        ORDER BY campaign.id"""

    # Issues a search request using streaming.
    stream: Iterator[SearchGoogleAdsStreamResponse] = ga_service.search_stream(
        customer_id=customer_id, query=query
    )

    for batch in stream:
        rows: List[GoogleAdsRow] = batch.results
        for row in rows:
            print(
                f"Campaign with ID {row.campaign.id} and name "
                f'"{row.campaign.name}" was found.'
            )get_campaigns.py
```

### Ruby

The Ruby gems for the client library are published to the [Rubygems gem\\
hosting site](https://rubygems.org/gems/google-ads-googleads). The recommended way
to install is using bundler. Add a line to your Gemfile:

```
gem 'google-ads-googleads', '~> 38.0.0'
```

Then run:

```
bundle install
```

Make a copy of the
[`google_ads_config.rb`](https://github.com/googleads/google-ads-ruby/blob/main/google_ads_config.rb)
file from the GitHub repository and modify it to include your credentials.

```
Google::Ads::GoogleAds::Config.new do |c|
  c.developer_token = 'INSERT_DEVELOPER_TOKEN_HERE'
  c.login_customer_id = 'INSERT_LOGIN_CUSTOMER_ID_HERE'
  c.keyfile = 'JSON_KEY_FILE_PATH'
end
```

Create a `GoogleAdsClient` instance by passing the path to where you keep
this file.

```
client = Google::Ads::GoogleAds::GoogleAdsClient.new('path/to/google_ads_config.rb')
```

Next, run a campaign report using the [`GoogleAdsService.SearchStream`](https://developers.google.com/google-ads/api/reference/rpc/v23/GoogleAdsService/SearchStream) method to retrieve the
campaigns in your account.

```
def get_campaigns(customer_id)
  # GoogleAdsClient will read a config file from
  # ENV['HOME']/google_ads_config.rb when called without parameters
  client = Google::Ads::GoogleAds::GoogleAdsClient.new

  responses = client.service.google_ads.search_stream(
    customer_id: customer_id,
    query: 'SELECT campaign.id, campaign.name FROM campaign ORDER BY campaign.id',
  )

  responses.each do |response|
    response.results.each do |row|
      puts "Campaign with ID #{row.campaign.id} and name '#{row.campaign.name}' was found."
    end
  end
endget_campaigns.rb
```

### Perl

The library is distributed on
[CPAN](https://metacpan.org/dist/Google-Ads-GoogleAds-Client). Start by cloning
the `google-ads-perl` repository in the directory of your choice.

```
git clone https://github.com/googleads/google-ads-perl.git
```

Change into the `google-ads-perl` directory and run the following command at
the command prompt to install all dependencies needed for using the library.

```
cd google-ads-perl
cpan install Module::Build
perl Build.PL
perl Build installdeps
```

Make a copy of the
[`googleads.properties`](https://github.com/googleads/google-ads-perl/blob/main/googleads.properties)
file from the GitHub repository and modify it to include your credentials.

```
jsonKeyFilePath=JSON_KEY_FILE_PATH
developerToken=INSERT_DEVELOPER_TOKEN_HERE
loginCustomerId=INSERT_LOGIN_CUSTOMER_ID_HERE
```

Create a `Client` instance by passing the path to where you keep this file.

```
my $properties_file = "/path/to/googleads.properties";

my $api_client = Google::Ads::GoogleAds::Client->new({
  properties_file => $properties_file
});
```

Next, run a campaign report using the [`GoogleAdsService.SearchStream`](https://developers.google.com/google-ads/api/reference/rpc/v23/GoogleAdsService/SearchStream) method to retrieve the
campaigns in your account.

```
sub get_campaigns {
  my ($api_client, $customer_id) = @_;

  # Create a search Google Ads stream request that will retrieve all campaigns.
  my $search_stream_request =
    Google::Ads::GoogleAds::V23::Services::GoogleAdsService::SearchGoogleAdsStreamRequest
    ->new({
      customerId => $customer_id,
      query      =>
        "SELECT campaign.id, campaign.name FROM campaign ORDER BY campaign.id"
    });

  # Get the GoogleAdsService.
  my $google_ads_service = $api_client->GoogleAdsService();

  my $search_stream_handler =
    Google::Ads::GoogleAds::Utils::SearchStreamHandler->new({
      service => $google_ads_service,
      request => $search_stream_request
    });

  # Issue a search request and process the stream response to print the requested
  # field values for the campaign in each row.
  $search_stream_handler->process_contents(
    sub {
      my $google_ads_row = shift;
      printf "Campaign with ID %d and name '%s' was found.\n",
        $google_ads_row->{campaign}{id}, $google_ads_row->{campaign}{name};
    });

  return 1;
}get_campaigns.pl
```

### curl

Start by setting the service account as the active credentials in gcloud
CLI.

```
gcloud auth login --cred-file=PATH_TO_CREDENTIALS_JSON
```

Next, fetch an OAuth 2.0 access token for the Google Ads API.

```
gcloud auth \
  print-access-token \
  --scopes='https://www.googleapis.com/auth/adwords'
```

Next, run a campaign report using the [`GoogleAdsService.SearchStream`](https://developers.google.com/google-ads/api/reference/rpc/v23/GoogleAdsService/SearchStream) method to retrieve the
campaigns in your account.

```
curl -i -X POST https://googleads.googleapis.com/v23/customers/CUSTOMER_ID/googleAds:searchStream \
   -H "Content-Type: application/json" \
   -H "Authorization: Bearer ACCESS_TOKEN" \
   -H "developer-token: DEVELOPER_TOKEN" \
   -H "login-customer-id: LOGIN_CUSTOMER_ID" \
   --data-binary "@query.json"
```

The contents of `query.json` are as follows:

```
{
  "query": "SELECT campaign.id, campaign.name, campaign.network_settings.target_content_network FROM campaign ORDER BY campaign.id"
}
```

If you encounter errors when making your first call, see
[Handle API errors](https://developers.google.com/google-ads/api/docs/get-started/handle-errors) for guidance on
troubleshooting.

[Previous\\
\\
arrow\_back\\
\\
Introduction](https://developers.google.com/google-ads/api/docs/get-started/introduction)

[Next\\
\\
Handle errors\\
\\
arrow\_forward](https://developers.google.com/google-ads/api/docs/get-started/handle-errors)



 Send feedback



Except as otherwise noted, the content of this page is licensed under the [Creative Commons Attribution 4.0 License](https://creativecommons.org/licenses/by/4.0/), and code samples are licensed under the [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0). For details, see the [Google Developers Site Policies](https://developers.google.com/site-policies). Java is a registered trademark of Oracle and/or its affiliates.

Last updated 2026-03-25 UTC.


Need to tell us more?






\[\[\["Easy to understand","easyToUnderstand","thumb-up"\],\["Solved my problem","solvedMyProblem","thumb-up"\],\["Other","otherUp","thumb-up"\]\],\[\["Missing the information I need","missingTheInformationINeed","thumb-down"\],\["Too complicated / too many steps","tooComplicatedTooManySteps","thumb-down"\],\["Out of date","outOfDate","thumb-down"\],\["Samples / code issue","samplesCodeIssue","thumb-down"\],\["Other","otherDown","thumb-down"\]\],\["Last updated 2026-03-25 UTC."\],\[\],\[\]\]