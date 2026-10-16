namespace CuraSphere.Domain.Entities;

public class BloodGroup : BaseEntity
{
    public long BloodGroupId { get; set; }
    public string BloodGroupName { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class MaritalStatus : BaseEntity
{
    public long MaritalStatusId { get; set; }
    public string StatusName { get; set; } = string.Empty;
}

public class Religion : BaseEntity
{
    public long ReligionId { get; set; }
    public string ReligionName { get; set; } = string.Empty;
}

public class Nationality : BaseEntity
{
    public long NationalityId { get; set; }
    public string CountryName { get; set; } = string.Empty;
    public string CountryCode { get; set; } = string.Empty;
}
