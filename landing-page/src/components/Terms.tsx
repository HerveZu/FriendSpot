import { useTranslation } from "react-i18next";

export function Terms() {
  const { t } = useTranslation();

  return (
    <div className="terms-container max-w-4xl mx-auto p-6 space-y-6 text-white">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{t("terms.title")}</h1>

        <h2 className="text-2xl font-semibold mt-6">
          {t("terms.sections.object.title")}
        </h2>
        <p>{t("terms.sections.object.content")}</p>

        <h2 className="text-2xl font-semibold mt-6">
          {t("terms.sections.accountCreation.title")}
        </h2>
        <p>{t("terms.sections.accountCreation.content")}</p>

        <h2 className="text-2xl font-semibold mt-6">
          {t("terms.sections.userContent.title")}
        </h2>
        <p>{t("terms.sections.userContent.content")}</p>

        <h2 className="text-2xl font-semibold mt-6">
          {t("terms.sections.subscriptions.title")}
        </h2>
        <p>{t("terms.sections.subscriptions.content")}</p>

        <h2 className="text-2xl font-semibold mt-6">
          {t("terms.sections.intellectualProperty.title")}
        </h2>
        <p>{t("terms.sections.intellectualProperty.content")}</p>

        <h2 className="text-2xl font-semibold mt-6">
          {t("terms.sections.feedback.title")}
        </h2>
        <p>{t("terms.sections.feedback.content")}</p>

        <h2 className="text-2xl font-semibold mt-6">
          {t("terms.sections.liability.title")}
        </h2>
        <p>{t("terms.sections.liability.content")}</p>

        <h2 className="text-2xl font-semibold mt-6">
          {t("terms.sections.abuseReporting.title")}
        </h2>
        <p>{t("terms.sections.abuseReporting.content")}</p>

        <h2 className="text-2xl font-semibold mt-6">
          {t("terms.sections.termination.title")}
        </h2>
        <p>{t("terms.sections.termination.content")}</p>

        <h2 className="text-2xl font-semibold mt-6">
          {t("terms.sections.applicableLaw.title")}
        </h2>
        <p>{t("terms.sections.applicableLaw.content")}</p>
      </div>
    </div>
  );
}

export default Terms;
