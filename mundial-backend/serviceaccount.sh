kubectl create serviceaccount k8sserviceaccount --namespace mundial2026
gcloud projects add-iam-policy-binding projects/mundial2026-481712 \
    --role=roles/container.clusterViewer \
    --member=principal://iam.googleapis.com/projects/651874636910/locations/global/workloadIdentityPools/mundial2026-481712.svc.id.goog/subject/ns/mundial2026/sa/k8sserviceaccount \
    --condition=None

gcloud projects add-iam-policy-binding projects/mundial2026-481712     --role=roles/iam.workloadIdentityUser     --member=principal://iam.googleapis.com/projects/651874636910/locations/global/workloadIdentityPools/mundial2026-481712.svc.id.goog/su
bject/ns/mundial2026/sa/k8sserviceaccount     --condition=None

gcloud projects add-iam-policy-binding projects/mundial2026-481712     --role=roles/datastore.user     --member=principal://iam.googleapis.com/projects/651874636910/locations/global/workloadIdentityPools/mundial2026-481712.svc.id.goog/su
bject/ns/mundial2026/sa/k8sserviceaccount     --condition=None


kubectl annotate serviceaccount k8sserviceaccount \
    --namespace mundial2026 \
    iam.gke.io/gcp-service-account=gkeserviceaccount@mundial2026-481712.iam.gserviceaccount.com


 