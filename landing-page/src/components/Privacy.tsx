import { useTranslation } from "react-i18next";

export function Privacy() {
  const { t } = useTranslation();

  return (
    <div className="privacy-container max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">{t("privacy.title")}</h1>
      <p>{t("privacy.lastUpdated", { date: "August 27, 2025" })}</p>

      <p>{t("privacy.intro")}</p>
      <p>
        {t("privacy.improveService")}{" "}
        <a
          href="https://www.termsfeed.com/privacy-policy-generator/"
          target="_blank"
          className="text-blue-600 underline"
        >
          {t("privacy.generator")}
        </a>
        .
      </p>

      <h2 className="text-2xl font-semibold mt-6">
        {t("privacy.interpretation.title")}
      </h2>

      <h3 className="text-xl font-semibold mt-4">
        {t("privacy.interpretation.subtitle")}
      </h3>
      <p>{t("privacy.interpretation.description")}</p>

      <h3 className="text-xl font-semibold mt-4">
        {t("privacy.definitions.title")}
      </h3>
      <p>{t("privacy.definitions.description")}</p>
      <ul className="list-disc list-inside space-y-2">
        <li>
          <strong>{t("privacy.definitions.account.title")}</strong>{" "}
          {t("privacy.definitions.account.description")}
        </li>
        <li>
          <strong>{t("privacy.definitions.affiliate.title")}</strong>{" "}
          {t("privacy.definitions.affiliate.description")}
        </li>
        <li>
          <strong>{t("privacy.definitions.application.title")}</strong>{" "}
          {t("privacy.definitions.application.description")}
        </li>
        <li>
          <strong>{t("privacy.definitions.company.title")}</strong>{" "}
          {t("privacy.definitions.company.description")}
        </li>
        <li>
          <strong>{t("privacy.definitions.cookies.title")}</strong>{" "}
          {t("privacy.definitions.cookies.description")}
        </li>
        <li>
          <strong>{t("privacy.definitions.country.title")}</strong>{" "}
          {t("privacy.definitions.country.description")}
        </li>
        <li>
          <strong>{t("privacy.definitions.device.title")}</strong>{" "}
          {t("privacy.definitions.device.description")}
        </li>
        <li>
          <strong>{t("privacy.definitions.personalData.title")}</strong>{" "}
          {t("privacy.definitions.personalData.description")}
        </li>
        <li>
          <strong>{t("privacy.definitions.service.title")}</strong>{" "}
          {t("privacy.definitions.service.description")}
        </li>
        <li>
          <strong>{t("privacy.definitions.serviceProvider.title")}</strong>{" "}
          {t("privacy.definitions.serviceProvider.description")}
        </li>
        <li>
          <strong>{t("privacy.definitions.usageData.title")}</strong>{" "}
          {t("privacy.definitions.usageData.description")}
        </li>
        <li>
          <strong>{t("privacy.definitions.website.title")}</strong>{" "}
          <a
            href="https://friendspot.app/"
            className="text-blue-600 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("privacy.definitions.website.description")}
          </a>
        </li>
        <li>
          <strong>{t("privacy.definitions.you.title")}</strong>{" "}
          {t("privacy.definitions.you.description")}
        </li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6">
        {t("privacy.dataCollection.title")}
      </h2>

      <h3 className="text-xl font-semibold mt-4">
        {t("privacy.dataCollection.types.title")}
      </h3>

      <h4 className="text-lg font-semibold mt-3">
        {t("privacy.dataCollection.personalData.title")}
      </h4>
      <p>{t("privacy.dataCollection.personalData.description")}</p>
      <ul className="list-disc list-inside space-y-2">
        <li>{t("privacy.dataCollection.personalData.email")}</li>
        <li>{t("privacy.dataCollection.personalData.usageData")}</li>
      </ul>

      <h4 className="text-lg font-semibold mt-3">
        {t("privacy.dataCollection.usageData.title")}
      </h4>
      <p>{t("privacy.dataCollection.usageData.description")}</p>

      <h4 className="text-lg font-semibold mt-3">
        {t("privacy.dataCollection.tracking.title")}
      </h4>
      <p>{t("privacy.dataCollection.tracking.description")}</p>
      <ul className="list-disc list-inside space-y-2">
        <li>
          <strong>{t("privacy.dataCollection.tracking.cookies.title")}</strong>{" "}
          {t("privacy.dataCollection.tracking.cookies.description")}
        </li>
        <li>
          <strong>
            {t("privacy.dataCollection.tracking.webBeacons.title")}
          </strong>{" "}
          {t("privacy.dataCollection.tracking.webBeacons.description")}
        </li>
      </ul>

      <h3 className="text-xl font-semibold mt-4">{t("privacy.usage.title")}</h3>
      <p>{t("privacy.usage.description")}</p>
      <ul className="list-disc list-inside space-y-2">
        <li>{t("privacy.usage.provideService")}</li>
        <li>{t("privacy.usage.manageAccount")}</li>
        <li>{t("privacy.usage.contact")}</li>
        <li>{t("privacy.usage.businessTransfers")}</li>
        <li>{t("privacy.usage.otherPurposes")}</li>
      </ul>

      <h3 className="text-xl font-semibold mt-4">
        {t("privacy.retention.title")}
      </h3>
      <p>{t("privacy.retention.description")}</p>

      <h3 className="text-xl font-semibold mt-4">
        {t("privacy.security.title")}
      </h3>
      <p>{t("privacy.security.description")}</p>

      <h2 className="text-2xl font-semibold mt-6">
        {t("privacy.children.title")}
      </h2>
      <p>{t("privacy.children.description")}</p>

      <h2 className="text-2xl font-semibold mt-6">
        {t("privacy.links.title")}
      </h2>
      <p>{t("privacy.links.description")}</p>

      <h2 className="text-2xl font-semibold mt-6">
        {t("privacy.changes.title")}
      </h2>
      <p>{t("privacy.changes.description")}</p>

      <h2 className="text-2xl font-semibold mt-6">
        {t("privacy.contact.title")}
      </h2>
      <ul className="list-disc list-inside space-y-2">
        <li>
          {t("privacy.contact.email")}{" "}
          <a
            href="mailto:support@friendspot.app"
            className="text-blue-600 underline"
          >
            support@friendspot.app
          </a>
        </li>
      </ul>
    </div>
  );
}

export default Privacy;
